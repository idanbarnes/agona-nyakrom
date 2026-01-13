const { pool } = require('../config/db');

const getHistory = async () => {
  const { rows } = await pool.query(
    `SELECT *
     FROM history
     WHERE published = true
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
};

const getGlobalSettings = async () => {
  const { rows } = await pool.query(
    `SELECT *
     FROM global_settings
     WHERE published = true
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
};

module.exports = {
  getHistory,
  getGlobalSettings,
};
