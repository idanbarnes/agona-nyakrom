const authService = require('../services/authService');
const { clearLoginRateLimit } = require('../middleware/adminLoginRateLimit');
const { success, error } = require('../utils/response');

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const result = await authService.loginAdmin(email, password);
    clearLoginRateLimit(req);
    return success(res, result, 'Login successful');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Error logging in admin:', err.message);
    return error(res, 'Failed to login', 500);
  }
};

// POST /logout
const logout = async (req, res) => {
  try {
    return success(res, null, 'Logout successful');
  } catch (err) {
    console.error('Error logging out admin:', err.message);
    return error(res, 'Failed to logout', 500);
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
  logout,
  me,
};
