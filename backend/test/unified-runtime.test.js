const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const originalConsoleError = console.error;

const loadAppModule = () => {
  const appModulePath = path.join(BACKEND_ROOT, 'src', 'app.js');
  const storageModulePath = path.join(BACKEND_ROOT, 'src', 'config', 'storage.js');
  delete require.cache[require.resolve(storageModulePath)];
  delete require.cache[require.resolve(appModulePath)];
  return require(appModulePath);
};

const writeFile = (filePath, contents) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
};

const createFixtureDirs = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-unified-runtime-'));
  const publicDir = path.join(root, 'public');
  const adminDir = path.join(root, 'admin');
  const uploadsDir = path.join(root, 'uploads');

  writeFile(
    path.join(publicDir, 'index.html'),
    '<!doctype html><html><head><title>Public App</title></head><body><div id="root">PUBLIC_APP_SHELL</div></body></html>'
  );
  writeFile(
    path.join(adminDir, 'index.html'),
    '<!doctype html><html><head><title>Admin App</title></head><body><div id="root">ADMIN_APP_SHELL</div></body></html>'
  );
  writeFile(path.join(adminDir, 'assets', 'app.js'), 'console.log("admin")');
  writeFile(path.join(uploadsDir, 'sample.txt'), 'uploaded-media');

  return { root, publicDir, adminDir, uploadsDir };
};

const withServer = async (app, callback) => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test.beforeEach(() => {
  process.chdir(BACKEND_ROOT);
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'agona_test';
  process.env.DB_USER = 'agona';
  process.env.DB_PASSWORD = 'agona';
  process.env.JWT_SECRET = 'test-jwt-secret-1234567890';
  process.env.PREVIEW_TOKEN_SECRET = 'test-preview-secret-1234567890';
  process.env.PUBLIC_SITE_URL = 'http://localhost:5174';
  process.env.ADMIN_SITE_URL = 'http://localhost:5173';
  process.env.CORS_ALLOWED_ORIGINS = '';
  process.env.UNIFIED_SITE_URL = 'http://localhost:5000';
  process.env.SITE_URL = 'http://localhost:5000';
  process.env.SEO_DISABLE_DB_LOOKUPS = 'true';
  delete process.env.PORT;
});

test.afterEach(() => {
  console.error = originalConsoleError;
});

test('resolveServerPort defaults to 5000 and validates overrides', () => {
  const { resolveServerPort } = loadAppModule();

  assert.equal(resolveServerPort(), 5000);
  assert.equal(resolveServerPort('5001'), 5001);
  assert.throws(
    () => resolveServerPort('0'),
    /Set PORT to an integer between 1 and 65535/
  );
  assert.throws(
    () => resolveServerPort('70000'),
    /Set PORT to an integer between 1 and 65535/
  );
  assert.throws(
    () => resolveServerPort('abc'),
    /Set PORT to an integer between 1 and 65535/
  );
});

test('startServer reports an actionable message when the configured port is already in use', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;

  const occupiedServer = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('occupied');
  });

  await new Promise((resolve) => {
    occupiedServer.listen(0, '127.0.0.1', resolve);
  });

  const occupiedAddress = occupiedServer.address();
  const occupiedPort = occupiedAddress.port;
  process.env.PORT = String(occupiedPort);

  const errorMessages = [];
  console.error = (message) => {
    errorMessages.push(String(message));
  };

  try {
    const { createApp, startServer } = loadAppModule();
    const app = createApp({
      publicDistDir: fixtures.publicDir,
      adminDistDir: fixtures.adminDir,
    });

    await assert.rejects(
      () =>
        startServer(app, {
          connectToDatabase: async () => {},
          host: '127.0.0.1',
        }),
      (error) => {
        assert.equal(error.code, 'EADDRINUSE');
        return true;
      }
    );
  } finally {
    await new Promise((resolve, reject) => {
      occupiedServer.close((error) => (error ? reject(error) : resolve()));
    });
  }

  assert.equal(errorMessages.length, 1);
  assert.match(errorMessages[0], new RegExp(`^Port ${occupiedPort} is already in use\\.`));
  assert.match(errorMessages[0], new RegExp(`netstat -ano \\| findstr :${occupiedPort}`));
  assert.match(errorMessages[0], /taskkill \/PID <PID> \/F/);
  assert.match(errorMessages[0], new RegExp(`\\$env:PORT=${occupiedPort + 1}`));
  assert.doesNotMatch(errorMessages[0], /Server is running on/);
});

test('buildFrontendPaths resolves from the backend location instead of process.cwd()', () => {
  const originalCwd = process.cwd();
  const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-unified-cwd-'));

  process.chdir(isolatedCwd);
  const { buildFrontendPaths } = loadAppModule();
  const paths = buildFrontendPaths();

  process.chdir(originalCwd);

  assert.equal(paths.publicDistDir, path.join(BACKEND_ROOT, 'dist', 'public'));
  assert.equal(paths.adminDistDir, path.join(BACKEND_ROOT, 'dist', 'admin'));
});

test('assertUnifiedBuildExists reports the first missing unified build artifacts clearly', () => {
  const fixtures = createFixtureDirs();
  fs.rmSync(path.join(fixtures.adminDir, 'assets'), { recursive: true, force: true });
  fs.rmSync(path.join(fixtures.publicDir, 'index.html'), { force: true });

  const { assertUnifiedBuildExists, buildFrontendPaths } = loadAppModule();

  assert.throws(
    () =>
      assertUnifiedBuildExists(
        buildFrontendPaths({
          publicDistDir: fixtures.publicDir,
          adminDistDir: fixtures.adminDir,
        })
      ),
    (error) => {
      assert.match(error.message, /npm run build:unified/);
      assert.match(error.message, /public frontend index/i);
      assert.match(error.message, /admin frontend assets directory/i);
      return true;
    }
  );
});

test('GET /api/health returns the health payload', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(json, { status: 'ok', message: 'Backend running' });
  });
});

test('unknown /api routes return JSON 404 instead of HTML', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    for (const accept of ['application/json', 'text/html']) {
      const response = await fetch(`${baseUrl}/api/does-not-exist`, {
        headers: { Accept: accept },
      });
      const text = await response.text();

      assert.equal(response.status, 404, accept);
      assert.match(response.headers.get('content-type') || '', /application\/json/i, accept);
      assert.doesNotMatch(text, /PUBLIC_APP_SHELL|ADMIN_APP_SHELL/, accept);
    }
  });
});

test('admin entry routes serve the admin application shell', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    for (const route of ['/admin', '/admin/', '/admin/news/edit/123?preview=1']) {
      const response = await fetch(`${baseUrl}${route}`);
      const html = await response.text();

      assert.equal(response.status, 200, route);
      assert.match(html, /ADMIN_APP_SHELL/, route);
      assert.match(html, /<meta name="robots" content="noindex,nofollow" \/>/);
      assert.doesNotMatch(html, /PUBLIC_APP_SHELL/, route);
    }

    const assetResponse = await fetch(`${baseUrl}/admin/assets/app.js`);
    const assetText = await assetResponse.text();

    assert.equal(assetResponse.status, 200);
    assert.match(assetText, /console\.log\("admin"\)/);
  });
});

test('public homepage raw HTML includes canonical metadata and structured data', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<title>Agona Nyakrom \| Official Public Website<\/title>/);
    assert.match(html, /<link rel="canonical" href="http:\/\/localhost:5000\/" \/>/);
    assert.match(html, /<meta property="og:locale" content="en_GH" \/>/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /PUBLIC_APP_SHELL|<main><h1>Agona Nyakrom<\/h1>/);
  });
});

test('preview-token public routes return noindex metadata in raw HTML', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/news/some-slug?preview_token=abc123`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<meta name="robots" content="noindex,nofollow" \/>/);
    assert.doesNotMatch(html, /<link rel="canonical"/);
  });
});

test('robots.txt references the configured sitemap and discourages indexing outside production', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/robots.txt`);
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/plain/i);
    assert.match(text, /Disallow: \//);
    assert.match(text, /Sitemap: http:\/\/localhost:5000\/sitemap.xml/);
    assert.doesNotMatch(text, /onrender\.com/);
  });
});

test('unified runtime serves built admin assets when the browser sends the unified origin header', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  process.env.PORT = '5001';
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:5174';
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/admin/assets/app.js`, {
      headers: { Origin: 'http://localhost:5001' },
    });
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('access-control-allow-origin') || '', /http:\/\/localhost:5001/);
    assert.match(text, /console\.log\("admin"\)/);
  });
});

test('public entry routes serve the public application shell', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    for (const route of ['/', '/news/some-slug']) {
      const response = await fetch(`${baseUrl}${route}`);
      const html = await response.text();

      assert.equal(response.status, 200, route);
      assert.match(html, /PUBLIC_APP_SHELL/, route);
      assert.doesNotMatch(html, /ADMIN_APP_SHELL/, route);
    }
  });
});

test('preview-token public routes stay classified as public routes', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/news/some-slug?preview_token=abc123`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /PUBLIC_APP_SHELL/);
    assert.doesNotMatch(html, /ADMIN_APP_SHELL/);
  });
});

test('/uploads assets are not intercepted by an SPA fallback', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const { createApp } = loadAppModule();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const existingResponse = await fetch(`${baseUrl}/uploads/sample.txt`);
    const existingText = await existingResponse.text();
    assert.equal(existingResponse.status, 200);
    assert.equal(existingText, 'uploaded-media');

    const missingResponse = await fetch(`${baseUrl}/uploads/missing.txt`);
    const missingText = await missingResponse.text();
    assert.equal(missingResponse.status, 404);
    assert.doesNotMatch(missingText, /PUBLIC_APP_SHELL|ADMIN_APP_SHELL/);
  });
});
