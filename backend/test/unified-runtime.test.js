const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const BACKEND_ROOT = path.resolve(__dirname, '..');

const loadCreateApp = () => {
  const appModulePath = path.join(BACKEND_ROOT, 'src', 'app.js');
  delete require.cache[require.resolve(appModulePath)];
  return require(appModulePath).createApp;
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
});

test('GET /api/health returns the health payload', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const createApp = loadCreateApp();
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
  const createApp = loadCreateApp();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`, {
      headers: { Accept: 'application/json' },
    });
    const text = await response.text();

    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type') || '', /application\/json/i);
    assert.doesNotMatch(text, /PUBLIC_APP_SHELL|ADMIN_APP_SHELL/);
  });
});

test('admin entry routes serve the admin application shell', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const createApp = loadCreateApp();
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
      assert.doesNotMatch(html, /PUBLIC_APP_SHELL/, route);
    }

    const assetResponse = await fetch(`${baseUrl}/admin/assets/app.js`);
    const assetText = await assetResponse.text();

    assert.equal(assetResponse.status, 200);
    assert.match(assetText, /console\.log\("admin"\)/);
  });
});

test('public entry routes serve the public application shell', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const createApp = loadCreateApp();
  const app = createApp({
    publicDistDir: fixtures.publicDir,
    adminDistDir: fixtures.adminDir,
  });

  await withServer(app, async (baseUrl) => {
    for (const route of ['/', '/news/some-slug?preview_token=abc123']) {
      const response = await fetch(`${baseUrl}${route}`);
      const html = await response.text();

      assert.equal(response.status, 200, route);
      assert.match(html, /PUBLIC_APP_SHELL/, route);
      assert.doesNotMatch(html, /ADMIN_APP_SHELL/, route);
    }
  });
});

test('/uploads assets are not intercepted by an SPA fallback', async () => {
  const fixtures = createFixtureDirs();
  process.env.UPLOAD_DIR = fixtures.uploadsDir;
  const createApp = loadCreateApp();
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
