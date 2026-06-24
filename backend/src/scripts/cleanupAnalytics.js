require('dotenv').config();

const { cleanupAnalyticsEvents } = require('../services/analyticsService');
const { pool } = require('../config/db');

const hasFlag = (flag) => process.argv.includes(flag);
const getArgValue = (name) => {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const main = async () => {
  const dryRun = !hasFlag('--execute');
  const retentionDays = getArgValue('--retention-days');
  const result = await cleanupAnalyticsEvents({ dryRun, retentionDays });
  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
