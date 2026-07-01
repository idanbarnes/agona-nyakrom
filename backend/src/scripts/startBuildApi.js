require('dotenv').config();

const { createApp, resolveServerPort } = require('../app');
const { connectDB, pool } = require('../config/db');
const { validateRuntimeEnv } = require('../config/env');

const start = async () => {
  validateRuntimeEnv();
  await connectDB();

  const port = resolveServerPort();
  const server = createApp().listen(port, '127.0.0.1', () => {
    console.log(`Build API server is running on http://127.0.0.1:${port}`);
  });

  const shutdown = async () => {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  };

  process.once('SIGTERM', () => {
    shutdown().finally(() => process.exit(0));
  });
  process.once('SIGINT', () => {
    shutdown().finally(() => process.exit(0));
  });
};

start().catch((error) => {
  console.error('Failed to start build API server:', error);
  process.exit(1);
});
