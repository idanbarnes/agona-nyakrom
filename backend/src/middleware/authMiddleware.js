const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { error } = require('../utils/response');
const { getJwtSecret } = require('../config/env');

const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const fetchAdminById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role FROM admins WHERE id = $1 AND active = true LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

const requireAdminAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return error(res, 'Authentication token missing', 401);
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return error(res, 'Invalid or expired token', 401);
    }

    const admin = await fetchAdminById(payload.id);
    if (!admin) {
      return error(res, 'Admin no longer exists', 401);
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return error(res, 'Authentication failed', 401);
  }
};

const optionalAdminAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (err) {
      // If token is present but invalid, treat as unauthenticated but continue
      return next();
    }

    const admin = await fetchAdminById(payload.id);
    if (!admin) {
      return next();
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return next();
  } catch (err) {
    console.error('Optional auth middleware error:', err.message);
    return next();
  }
};

module.exports = {
  requireAdminAuth,
  optionalAdminAuth,
};
