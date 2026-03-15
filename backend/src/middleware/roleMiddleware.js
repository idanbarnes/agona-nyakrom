const { error } = require('../utils/response');

const MASTER_ADMIN_ROLE = 'master_admin';

const requireMasterAdmin = (req, res, next) => {
  if (!req.admin) {
    return error(res, 'Not authenticated', 401);
  }

  if (req.admin.role !== MASTER_ADMIN_ROLE) {
    return error(res, 'Master admin access is required for this action.', 403);
  }

  return next();
};

module.exports = {
  MASTER_ADMIN_ROLE,
  requireMasterAdmin,
};
