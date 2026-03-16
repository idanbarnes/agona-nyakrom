require('dotenv').config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const buildConnection = () => {
  if (process.env.DATABASE_URL) {
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
    port: process.env.DB_PORT,
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
