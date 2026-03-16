const REQUIRED_DB_ENV = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

const normalize = (value = '') => String(value || '').trim();
const isTruthy = (value = '') =>
  ['1', 'true', 'yes', 'on'].includes(normalize(value).toLowerCase());

const isPlaceholderSecret = (value = '') => {
  const normalized = normalize(value).toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    normalized.startsWith('replace-with') ||
    normalized.startsWith('your_') ||
    normalized.startsWith('your-') ||
    normalized.includes('yourpassword') ||
    normalized.includes('secret_key_here')
  );
};

const getDbSslConfig = () =>
  isTruthy(process.env.DB_SSL) ? { rejectUnauthorized: false } : false;

const validateDatabaseEnv = () => {
  const hasDatabaseUrl = Boolean(normalize(process.env.DATABASE_URL));
  const missing = hasDatabaseUrl
    ? []
    : REQUIRED_DB_ENV.filter((key) => !normalize(process.env[key]));

  if (process.env.RENDER && !hasDatabaseUrl) {
    throw new Error(
      'DATABASE_URL is required on Render. Add your Neon connection string in the Render Environment panel.'
    );
  }

  if (missing.length) {
    throw new Error(
      `Missing database environment variables: ${missing.join(
        ', '
      )}. Set DATABASE_URL or provide the full DB_* configuration.`
    );
  }
};

const buildDatabaseConnectionConfig = () => {
  validateDatabaseEnv();

  if (normalize(process.env.DATABASE_URL)) {
    return {
      connectionString: normalize(process.env.DATABASE_URL),
      ssl: getDbSslConfig(),
    };
  }

  return {
    host: normalize(process.env.DB_HOST),
    port: Number(process.env.DB_PORT) || 5432,
    database: normalize(process.env.DB_NAME),
    user: normalize(process.env.DB_USER),
    password: normalize(process.env.DB_PASSWORD),
    ssl: getDbSslConfig(),
  };
};

const getJwtSecret = () => {
  const value = normalize(process.env.JWT_SECRET);
  if (isPlaceholderSecret(value)) {
    throw new Error(
      'JWT_SECRET is missing or still uses a placeholder value. Set a real long random secret in the Render Environment panel.'
    );
  }
  return value;
};

const getPreviewTokenSecret = () => {
  const previewValue = normalize(process.env.PREVIEW_TOKEN_SECRET);
  if (previewValue && !isPlaceholderSecret(previewValue)) {
    return previewValue;
  }
  return getJwtSecret();
};

const validateCloudinaryEnv = () => {
  const mediaStorage = normalize(process.env.MEDIA_STORAGE || 'local').toLowerCase();
  if (mediaStorage !== 'cloudinary') {
    return;
  }

  const required = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  const missing = required.filter((key) => !normalize(process.env[key]));

  if (missing.length) {
    throw new Error(
      `Cloudinary storage is enabled but these environment variables are missing: ${missing.join(
        ', '
      )}.`
    );
  }
};

const validateRuntimeEnv = () => {
  validateDatabaseEnv();
  getJwtSecret();
  getPreviewTokenSecret();
  validateCloudinaryEnv();
};

module.exports = {
  buildDatabaseConnectionConfig,
  getDbSslConfig,
  getJwtSecret,
  getPreviewTokenSecret,
  isTruthy,
  normalize,
  validateCloudinaryEnv,
  validateDatabaseEnv,
  validateRuntimeEnv,
};
