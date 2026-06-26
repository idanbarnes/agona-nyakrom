const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const BACKEND_ROOT = path.resolve(__dirname, '..');

const clearUploadModules = () => {
  [
    '../src/config/storage',
    '../src/config/env',
    '../src/middleware/uploadMiddleware',
    '../src/services/cloudinaryService',
    '../src/services/mediaService',
  ].forEach((modulePath) => {
    delete require.cache[require.resolve(modulePath)];
  });
};

const createPngBuffer = () =>
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64'
  );

const withServer = async (app, callback) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

const createUploadTestApp = () => {
  const upload = require('../src/middleware/uploadMiddleware');
  const app = express();

  app.post('/upload', upload.single('image'), (req, res) => {
    res.json({
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
    });
  });

  app.use((err, req, res, next) => {
    if (!err) return next();
    res.status(400).json({
      success: false,
      message: err.message,
    });
  });

  return app;
};

test.beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.MEDIA_STORAGE = 'local';
  delete process.env.ALLOW_PRODUCTION_LOCAL_UPLOADS;
});

test.afterEach(() => {
  delete process.env.UPLOAD_DIR;
  delete process.env.MEDIA_STORAGE;
  clearUploadModules();
});

test('local development image processing writes managed /uploads paths', async () => {
  const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-media-local-'));
  process.env.NODE_ENV = 'development';
  process.env.MEDIA_STORAGE = 'local';
  process.env.UPLOAD_DIR = uploadsRoot;
  clearUploadModules();

  const { processImage } = require('../src/services/mediaService');
  const result = await processImage(
    {
      buffer: createPngBuffer(),
      mimetype: 'image/png',
      size: createPngBuffer().length,
    },
    'news',
    'local-test'
  );

  assert.equal(result.original, 'uploads/news/news-local-test-original.webp');
  assert.equal(result.large, 'uploads/news/news-local-test-large.webp');
  assert.ok(fs.existsSync(path.join(uploadsRoot, 'news', 'news-local-test-original.webp')));
});

test('production local image processing is rejected without explicit override', async () => {
  process.env.NODE_ENV = 'production';
  process.env.MEDIA_STORAGE = 'local';
  clearUploadModules();

  const { processImage } = require('../src/services/mediaService');

  await assert.rejects(
    () =>
      processImage(
        {
          buffer: createPngBuffer(),
          mimetype: 'image/png',
          size: createPngBuffer().length,
        },
        'news',
        'prod-local-test'
      ),
    /Production news image uploads require persistent Cloudinary storage/
  );
});

test('upload middleware rejects unsafe file types', async () => {
  const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-upload-reject-'));
  process.env.UPLOAD_DIR = uploadsRoot;
  clearUploadModules();

  await withServer(createUploadTestApp(), async (baseUrl) => {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('not an image')], { type: 'text/plain' }), 'note.txt');

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.message, /Invalid file type/);
  });
});

test('upload middleware enforces the 5 MB size limit', async () => {
  const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-upload-size-'));
  process.env.UPLOAD_DIR = uploadsRoot;
  clearUploadModules();

  await withServer(createUploadTestApp(), async (baseUrl) => {
    const form = new FormData();
    form.append(
      'image',
      new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }),
      'large.png'
    );

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.message, /File too large|file size/i);
  });
});

test('upload middleware sanitizes temporary filenames', async () => {
  const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agona-upload-safe-name-'));
  process.env.UPLOAD_DIR = uploadsRoot;
  clearUploadModules();

  await withServer(createUploadTestApp(), async (baseUrl) => {
    const form = new FormData();
    form.append(
      'image',
      new Blob([createPngBuffer()], { type: 'image/png' }),
      '..\\..\\bad name.png'
    );

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.doesNotMatch(payload.filename, /[\\/]/);
    assert.match(payload.filename, /^\d+-bad-name\.png$/);
    assert.ok(fs.existsSync(path.join(uploadsRoot, 'tmp', payload.filename)));
  });
});
