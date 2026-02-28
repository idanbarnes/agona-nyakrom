const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables.');
}

/**
 * Authenticate an admin and return a signed JWT plus public admin info.
 * @param {string} emailOrUsername
 * @param {string} password
 * @returns {Promise<{ token: string, admin: { id: string, email: string, name: string } }>}
 */
const loginAdmin = async (emailOrUsername, password) => {
  const invalidCredsError = { status: 401, message: 'Invalid email or password' };

  // Look up admin by email or display name to match current login UI copy.
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, role, name
     FROM admins
     WHERE (email = $1 OR name = $1) AND active = true
     LIMIT 1`,
    [emailOrUsername]
  );

  const admin = rows[0];
  if (!admin) {
    throw invalidCredsError;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw invalidCredsError;
  }

  // Sign JWT
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: 'admin',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  };
};

module.exports = {
  loginAdmin,
};
