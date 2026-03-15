const authService = require('../services/authService');
const adminUserService = require('../services/admin/adminUserService');
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

// POST /bootstrap
const bootstrap = async (req, res) => {
  try {
    const { bootstrap_token, email, password, name } = req.body || {};

    if (!bootstrap_token || !email || !password || !name) {
      return error(res, 'Bootstrap token, name, email, and password are required', 400);
    }

    const created = await adminUserService.bootstrapAdmin({
      bootstrapToken: bootstrap_token,
      email,
      password,
      name,
    });

    return success(
      res,
      authService.buildAuthResponse(created),
      'Admin bootstrap successful',
      201
    );
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Error bootstrapping admin:', err.message);
    return error(res, 'Failed to bootstrap admin', 500);
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
  bootstrap,
  login,
  logout,
  me,
};
