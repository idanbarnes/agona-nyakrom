require('dotenv').config();

const { createApp, startServer } = require('./src/app');

const app = createApp();

if (require.main === module) {
  startServer(app);
}

module.exports = app;
