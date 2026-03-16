require('dotenv').config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const missing = hasDatabaseUrl ? [] : requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(
    `Missing database environment variables: ${missing.join(
      ', '
    )}. Set DATABASE_URL for hosted Postgres on Render, or provide the full DB_* set.`
  );
}

const buildConnection = () => {
  if (hasDatabaseUrl) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
    };
  }

  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
    ssl,
  };
};

const sharedConfig = {
  client: 'pg',
  connection: buildConnection(),
  migrations: {
    directory: './migrations',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

module.exports = {
  development: sharedConfig,
  production: sharedConfig,
  staging: sharedConfig,
};
