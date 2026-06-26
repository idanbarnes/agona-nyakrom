const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeUploadPath } = require('../src/utils/uploadPath');

test('loopback upload URLs are normalized to same-origin upload paths', () => {
  assert.equal(
    normalizeUploadPath('http://localhost:5174/uploads/hall-of-fame/example.webp'),
    '/uploads/hall-of-fame/example.webp'
  );
  assert.equal(
    normalizeUploadPath('http://127.0.0.1:5174/uploads/hall-of-fame/example.webp'),
    '/uploads/hall-of-fame/example.webp'
  );
});

test('non-loopback absolute URLs are preserved', () => {
  assert.equal(
    normalizeUploadPath('https://res.cloudinary.com/demo/image/upload/example.webp'),
    'https://res.cloudinary.com/demo/image/upload/example.webp'
  );
});

test('relative upload paths get a leading slash', () => {
  assert.equal(
    normalizeUploadPath('uploads/hall-of-fame/example.webp'),
    '/uploads/hall-of-fame/example.webp'
  );
});
