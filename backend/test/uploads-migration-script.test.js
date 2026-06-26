const test = require('node:test');
const assert = require('node:assert/strict');

test.before(() => {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'agona_test';
  process.env.DB_USER = 'agona';
  process.env.DB_PASSWORD = 'agona';
  process.env.JWT_SECRET = 'test-jwt-secret-1234567890';
});

test('uploads-to-Cloudinary migration defaults to dry-run mode', () => {
  const { parseExecutionMode } = require('../src/scripts/migrateLocalUploadsToCloudinary');

  assert.deepEqual(parseExecutionMode(['node', 'script']), {
    dryRun: true,
    execute: false,
  });
});

test('uploads-to-Cloudinary migration requires --execute for writes', () => {
  const { parseExecutionMode } = require('../src/scripts/migrateLocalUploadsToCloudinary');

  assert.deepEqual(parseExecutionMode(['node', 'script', '--execute']), {
    dryRun: false,
    execute: true,
  });
});

test('uploads-to-Cloudinary migration rejects conflicting modes', () => {
  const { parseExecutionMode } = require('../src/scripts/migrateLocalUploadsToCloudinary');

  assert.throws(
    () => parseExecutionMode(['node', 'script', '--dry-run', '--execute']),
    /either --dry-run or --execute/
  );
});

test('uploads-to-Cloudinary migration only targets local upload references', () => {
  const { extractUploadPath } = require('../src/scripts/migrateLocalUploadsToCloudinary');

  assert.equal(extractUploadPath('/uploads/news/photo.webp'), 'uploads/news/photo.webp');
  assert.equal(extractUploadPath('uploads/news/photo.webp'), 'uploads/news/photo.webp');
  assert.equal(
    extractUploadPath('http://localhost:5000/uploads/news/photo.webp'),
    'uploads/news/photo.webp'
  );
  assert.equal(
    extractUploadPath('https://res.cloudinary.com/demo/image/upload/photo.webp'),
    null
  );
});
