const { error } = require('../utils/response');

const WINDOW_MS = Number(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5);

const attempts = new Map();

const getClientKey = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const getEntry = (key) => {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || existing.expiresAt <= now) {
    return {
      count: 0,
      expiresAt: now + WINDOW_MS,
    };
  }

  return existing;
};

const adminLoginRateLimit = (req, res, next) => {
  if (MAX_ATTEMPTS <= 0 || WINDOW_MS <= 0) {
    return next();
  }

  const key = getClientKey(req);
  const entry = getEntry(key);

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    res.set('Retry-After', String(retryAfterSeconds));
    return error(res, 'Too many login attempts. Please try again later.', 429);
  }

  entry.count += 1;
  attempts.set(key, entry);
  req.loginRateLimitKey = key;

  return next();
};

const clearLoginRateLimit = (req) => {
  const key = req?.loginRateLimitKey || getClientKey(req || {});
  if (!key) return;
  attempts.delete(key);
};

module.exports = {
  adminLoginRateLimit,
  clearLoginRateLimit,
};
