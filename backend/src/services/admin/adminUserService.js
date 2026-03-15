const bcrypt = require('bcrypt');
const crypto = require('crypto');
const adminsModel = require('../../models/admins');
const { MASTER_ADMIN_ROLE } = require('../../middleware/roleMiddleware');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = Number(process.env.ADMIN_PASSWORD_MIN_LENGTH || 10);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(['admin', MASTER_ADMIN_ROLE]);

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const normalizeName = (value = '') => String(value).trim();
const isTruthy = (value = '') => ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());

const createError = (status, message) => ({ status, message });

const normalizeRole = (value = 'admin') => String(value).trim().toLowerCase();

const validateRole = (role) => {
  const normalizedRole = normalizeRole(role || 'admin');
  if (!VALID_ROLES.has(normalizedRole)) {
    throw createError(400, 'Role must be either admin or master_admin.');
  }
  return normalizedRole;
};

const assertValidAdminInput = ({ email, password, name }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(name);

  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    throw createError(400, 'A valid email address is required.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw createError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (!normalizedName) {
    throw createError(400, 'Name is required.');
  }

  return {
    email: normalizedEmail,
    password,
    name: normalizedName,
  };
};

const createAdmin = async ({ email, password, name, role = 'admin', active = true }) => {
  const normalized = assertValidAdminInput({ email, password, name });
  const normalizedRole = validateRole(role);
  const existing = await adminsModel.findByEmail(normalized.email);

  if (existing) {
    throw createError(409, 'An admin with that email already exists.');
  }

  const password_hash = await bcrypt.hash(normalized.password, SALT_ROUNDS);
  return adminsModel.create({
    email: normalized.email,
    password_hash,
    role: normalizedRole,
    active,
    name: normalized.name,
  });
};

const listAdmins = async ({ limit = 50, offset = 0 } = {}) => {
  return adminsModel.findAll(limit, offset);
};

const compareBootstrapToken = (providedToken = '', configuredToken = '') => {
  const provided = Buffer.from(String(providedToken));
  const configured = Buffer.from(String(configuredToken));

  if (!provided.length || provided.length !== configured.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, configured);
};

const bootstrapAdmin = async ({ bootstrapToken, email, password, name }) => {
  const configuredToken = String(process.env.ADMIN_BOOTSTRAP_TOKEN || '').trim();
  if (!configuredToken) {
    throw createError(
      503,
      'Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_TOKEN on the backend first.'
    );
  }

  if (!compareBootstrapToken(bootstrapToken, configuredToken)) {
    throw createError(401, 'Invalid bootstrap token.');
  }

  const adminCount = await adminsModel.countAll();
  const allowWhenAdminsExist = isTruthy(process.env.ALLOW_ADMIN_BOOTSTRAP_WHEN_ADMINS_EXIST);

  if (adminCount > 0 && !allowWhenAdminsExist) {
    throw createError(
      409,
      'Bootstrap is disabled because an admin already exists. Use the authenticated admin create endpoint instead.'
    );
  }

  return createAdmin({
    email,
    password,
    name: name || 'Initial Admin',
    role: MASTER_ADMIN_ROLE,
  });
};

const updateAdmin = async ({
  targetAdminId,
  actorAdminId,
  email,
  password,
  name,
  role,
  active,
}) => {
  const existing = await adminsModel.findById(targetAdminId);
  if (!existing) {
    throw createError(404, 'Admin account not found.');
  }

  const updates = {};

  if (email !== undefined) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      throw createError(400, 'A valid email address is required.');
    }

    const adminWithEmail = await adminsModel.findByEmail(normalizedEmail);
    if (adminWithEmail && adminWithEmail.id !== targetAdminId) {
      throw createError(409, 'An admin with that email already exists.');
    }

    updates.email = normalizedEmail;
  }

  if (name !== undefined) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
      throw createError(400, 'Name is required.');
    }
    updates.name = normalizedName;
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      throw createError(
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
    }
    updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const nextRole = role !== undefined ? validateRole(role) : existing.role;
  const nextActive = active !== undefined ? Boolean(active) : existing.active;

  if (role !== undefined) {
    updates.role = nextRole;
  }

  if (active !== undefined) {
    updates.active = nextActive;
  }

  const isTargetSelf = targetAdminId === actorAdminId;
  const removesMasterAccess =
    existing.role === MASTER_ADMIN_ROLE &&
    (nextRole !== MASTER_ADMIN_ROLE || nextActive === false);

  if (isTargetSelf && removesMasterAccess) {
    throw createError(400, 'You cannot remove your own master admin access.');
  }

  if (removesMasterAccess) {
    const activeMasterCount = await adminsModel.countActiveByRole(MASTER_ADMIN_ROLE);
    if (activeMasterCount <= 1) {
      throw createError(400, 'At least one active master admin must remain.');
    }
  }

  if (!Object.keys(updates).length) {
    throw createError(400, 'No valid changes were provided.');
  }

  return adminsModel.update(targetAdminId, updates);
};

const deleteAdmin = async ({ targetAdminId, actorAdminId }) => {
  const existing = await adminsModel.findById(targetAdminId);
  if (!existing) {
    throw createError(404, 'Admin account not found.');
  }

  if (targetAdminId === actorAdminId) {
    throw createError(400, 'You cannot delete your own admin account.');
  }

  if (existing.role === MASTER_ADMIN_ROLE && existing.active !== false) {
    const activeMasterCount = await adminsModel.countActiveByRole(MASTER_ADMIN_ROLE);
    if (activeMasterCount <= 1) {
      throw createError(400, 'At least one active master admin must remain.');
    }
  }

  await adminsModel.delete(targetAdminId);
  return existing;
};

module.exports = {
  bootstrapAdmin,
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
};
