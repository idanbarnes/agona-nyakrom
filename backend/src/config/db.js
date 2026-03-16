const { Pool } = require('pg');
const { buildDatabaseConnectionConfig } = require('./env');

const poolConfig = buildDatabaseConnectionConfig();

// Create a reusable pool using environment variables (never hard-code secrets)
const pool = new Pool(poolConfig);

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
  pool,
  connectDB,
};
