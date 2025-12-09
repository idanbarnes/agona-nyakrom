require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

const seedAdmin = async () => {
  const email = process.env.ADMIN_DEFAULT_EMAIL;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!email || !password) {
    console.error('Missing ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD in environment.');
    process.exit(1);
  }

  try {
    const { rows } = await pool.query('SELECT id FROM admins WHERE email = $1 LIMIT 1', [
      email,
    ]);

    if (rows.length) {
      console.log(`Admin with email ${email} already exists. No action taken.`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertQuery = `
      INSERT INTO admins (email, password_hash, role, active, name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email
    `;

    const { rows: inserted } = await pool.query(insertQuery, [
      email,
      passwordHash,
      'admin',
      true,
      'Default Admin',
    ]);

    console.log('Default admin created:', inserted[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedAdmin();
