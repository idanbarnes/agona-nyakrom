const { isTruthy } = require('./env');

const parsePositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const getAnalyticsConfig = () => ({
  enabled: process.env.ANALYTICS_ENABLED
    ? isTruthy(process.env.ANALYTICS_ENABLED)
    : process.env.NODE_ENV !== 'test',
  retentionDays: parsePositiveInteger(process.env.ANALYTICS_RETENTION_DAYS, 180, 730),
  maxPayloadBytes: parsePositiveInteger(process.env.ANALYTICS_MAX_PAYLOAD_BYTES, 4096, 16384),
  rateLimitWindowMs: parsePositiveInteger(
    process.env.ANALYTICS_RATE_LIMIT_WINDOW_MS,
    60 * 1000,
    10 * 60 * 1000
  ),
  rateLimitMaxEvents: parsePositiveInteger(process.env.ANALYTICS_RATE_LIMIT_MAX_EVENTS, 60, 600),
  dedupeWindowMs: parsePositiveInteger(process.env.ANALYTICS_DEDUPE_WINDOW_MS, 10 * 1000, 60 * 1000),
  adminMaxRangeDays: parsePositiveInteger(process.env.ANALYTICS_ADMIN_MAX_RANGE_DAYS, 180, 730),
  recentWindowMinutes: parsePositiveInteger(
    process.env.ANALYTICS_RECENT_WINDOW_MINUTES,
    30,
    24 * 60
  ),
});

module.exports = {
  getAnalyticsConfig,
};
