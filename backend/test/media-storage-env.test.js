const test = require('node:test');
const assert = require('node:assert/strict');

const loadEnv = () => {
  const envModulePath = require.resolve('../src/config/env');
  delete require.cache[envModulePath];
  return require('../src/config/env');
};

const resetMediaEnv = () => {
  delete process.env.MEDIA_STORAGE;
  delete process.env.ALLOW_PRODUCTION_LOCAL_UPLOADS;
  delete process.env.ALLOW_RENDER_LOCAL_UPLOADS;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  delete process.env.RENDER;
};

test.beforeEach(() => {
  resetMediaEnv();
  process.env.NODE_ENV = 'test';
});

test.afterEach(() => {
  resetMediaEnv();
});

test('MEDIA_STORAGE defaults to local outside production', () => {
  const { getMediaStorageMode, validateMediaStorageEnv } = loadEnv();

  assert.equal(getMediaStorageMode(), 'local');
  assert.doesNotThrow(() => validateMediaStorageEnv());
});

test('production defaults missing MEDIA_STORAGE to cloudinary', () => {
  process.env.NODE_ENV = 'production';
  const { getMediaStorageMode, validateMediaStorageEnv } = loadEnv();

  assert.equal(getMediaStorageMode(), 'cloudinary');
  assert.doesNotThrow(() => validateMediaStorageEnv());
});

test('invalid MEDIA_STORAGE values fail clearly', () => {
  process.env.MEDIA_STORAGE = 'disk';
  const { validateMediaStorageEnv } = loadEnv();

  assert.throws(
    () => validateMediaStorageEnv(),
    /Invalid MEDIA_STORAGE value "disk".*local, cloudinary/
  );
});

test('production rejects local storage unless explicitly overridden', () => {
  process.env.NODE_ENV = 'production';
  process.env.MEDIA_STORAGE = 'local';
  const { validateMediaStorageEnv } = loadEnv();

  assert.throws(
    () => validateMediaStorageEnv(),
    /Production uploads must use Cloudinary-backed storage/
  );
});

test('production local storage override is explicit', () => {
  process.env.NODE_ENV = 'production';
  process.env.MEDIA_STORAGE = 'local';
  process.env.ALLOW_PRODUCTION_LOCAL_UPLOADS = 'true';
  const { validateMediaStorageEnv } = loadEnv();

  assert.doesNotThrow(() => validateMediaStorageEnv());
});

test('Cloudinary storage requires credentials', () => {
  process.env.MEDIA_STORAGE = 'cloudinary';
  const { validateCloudinaryEnv } = loadEnv();

  assert.throws(
    () => validateCloudinaryEnv(),
    /CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET/
  );
});

test('Cloudinary storage accepts required credentials', () => {
  process.env.MEDIA_STORAGE = 'cloudinary';
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = 'key';
  process.env.CLOUDINARY_API_SECRET = 'secret';
  const { validateCloudinaryEnv } = loadEnv();

  assert.doesNotThrow(() => validateCloudinaryEnv());
});
