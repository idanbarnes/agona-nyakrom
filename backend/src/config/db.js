const { Pool } = require('pg');

// Validate required environment variables early so connection errors are clearer
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  // Throw with a readable message to help newcomers configure their .env file
  throw new Error(
    `Missing database environment variables: ${missing.join(
      ', '
    )}. Please set them in your .env file.`
  );
}

// Create a reusable pool using environment variables (never hard-code secrets)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

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
