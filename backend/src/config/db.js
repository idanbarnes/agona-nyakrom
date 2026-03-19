const { Pool } = require('pg');
const { buildDatabaseConnectionConfig } = require('./env');

const poolConfig = {
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 10,
  ...buildDatabaseConnectionConfig(),
};

const TRANSIENT_DB_ERROR_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ECONNREFUSED',
  '57P01',
  '57P02',
  '57P03',
  '53300',
]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDatabaseError = (err) => {
  if (!err) {
    return false;
  }

  if (TRANSIENT_DB_ERROR_CODES.has(err.code)) {
    return true;
  }

  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('econnreset') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('terminating connection due to administrator command') ||
    message.includes('server closed the connection unexpectedly')
  );
};

const extractQueryText = (queryConfig) => {
  if (typeof queryConfig === 'string') {
    return queryConfig;
  }

  if (queryConfig && typeof queryConfig.text === 'string') {
    return queryConfig.text;
  }

  return '';
};

const isReadOnlyQuery = (queryConfig) => {
  const text = extractQueryText(queryConfig).trim().toLowerCase();
  if (!text) {
    return false;
  }

  return text.startsWith('select') || text.startsWith('with');
};

// Create a reusable pool using environment variables (never hard-code secrets)
const pool = new Pool(poolConfig);
const rawQuery = pool.query.bind(pool);

pool.query = async (...args) => {
  const retries = isReadOnlyQuery(args[0]) ? 1 : 0;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await rawQuery(...args);
    } catch (error) {
      if (attempt >= retries || !isTransientDatabaseError(error)) {
        throw error;
      }

      console.warn(
        `Transient database error (${error.code || 'unknown'}) on read query. Retrying once.`
      );
      await wait(200);
    }
  }

  throw new Error('Database query failed unexpectedly.');
};

// Surface any unexpected pool errors during runtime
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

// Attempt an initial connection to confirm connectivity; release immediately
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error; // Let the caller decide how to handle startup failure
  }
};

module.exports = {
  isTransientDatabaseError,
  pool,
  connectDB,
};
