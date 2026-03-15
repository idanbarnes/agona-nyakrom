const adminUserService = require('../../services/admin/adminUserService');
const { success, error } = require('../../utils/response');

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const listAdmins = async (req, res) => {
  try {
    const limit = Math.min(parsePositiveInteger(req.query.limit, 50), 100);
    const offset = parsePositiveInteger(req.query.offset, 0);
    const admins = await adminUserService.listAdmins({ limit, offset });
    return success(res, admins, 'Admins fetched successfully');
  } catch (err) {
    console.error('Error listing admins:', err.message);
    return error(res, 'Failed to fetch admins', 500);
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, name, role, active } = req.body || {};
    const created = await adminUserService.createAdmin({
      email,
      password,
      name,
      role: typeof role === 'string' && role.trim() ? role.trim() : 'admin',
      active: active !== false,
    });

    return success(res, created, 'Admin account created successfully', 201);
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }

    console.error('Error creating admin:', err.message);
    return error(res, 'Failed to create admin account', 500);
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, role, active } = req.body || {};

    const updated = await adminUserService.updateAdmin({
      targetAdminId: id,
      actorAdminId: req.admin?.id,
      email,
      password,
      name,
      role,
      active,
    });

    return success(res, updated, 'Admin account updated successfully');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }

    console.error('Error updating admin:', err.message);
    return error(res, 'Failed to update admin account', 500);
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const deleted = await adminUserService.deleteAdmin({
      targetAdminId: req.params.id,
      actorAdminId: req.admin?.id,
    });

    return success(res, deleted, 'Admin account deleted successfully');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }

    console.error('Error deleting admin:', err.message);
    return error(res, 'Failed to delete admin account', 500);
  }
};

module.exports = {
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
};
