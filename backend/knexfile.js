require('dotenv').config();
const { buildDatabaseConnectionConfig } = require('./src/config/env');

const sharedConfig = {
  client: 'pg',
  connection: buildDatabaseConnectionConfig(),
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
