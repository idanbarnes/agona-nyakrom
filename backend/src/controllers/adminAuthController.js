const authService = require('../services/authService');
const { success, error } = require('../utils/response');

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const result = await authService.loginAdmin(email, password);
    return success(res, result, 'Login successful');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Error logging in admin:', err.message);
    return error(res, 'Failed to login', 500);
  }
};

// GET /me
const me = async (req, res) => {
  try {
    if (!req.admin) {
      return error(res, 'Not authenticated', 401);
    }
    return success(res, req.admin, 'Authenticated admin');
  } catch (err) {
    console.error('Error fetching admin profile:', err.message);
    return error(res, 'Failed to fetch admin profile', 500);
  }
};

module.exports = {
  login,
  me,
};
