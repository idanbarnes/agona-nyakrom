require('dotenv').config();

const { createApp, startServer } = require('./src/app');

const app = createApp();

if (require.main === module) {
  startServer(app).catch(() => {
    process.exit(1);
  });
}

module.exports = app;
