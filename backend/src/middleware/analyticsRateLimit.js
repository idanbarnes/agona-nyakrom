const { getAnalyticsConfig } = require('../config/analytics');

const rateBuckets = new Map();
const dedupeBuckets = new Map();

const now = () => Date.now();

const getClientKey = (req) =>
  String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 96);

const cleanup = (map, cutoff) => {
  for (const [key, value] of map.entries()) {
    if ((value.expiresAt || value.lastSeen || 0) < cutoff) {
      map.delete(key);
    }
  }
};

const analyticsRateLimit = (req, res, next) => {
  const config = getAnalyticsConfig();
  const timestamp = now();
  cleanup(rateBuckets, timestamp);

  const key = getClientKey(req);
  const bucket = rateBuckets.get(key) || {
    count: 0,
    expiresAt: timestamp + config.rateLimitWindowMs,
  };

  if (bucket.expiresAt <= timestamp) {
    bucket.count = 0;
    bucket.expiresAt = timestamp + config.rateLimitWindowMs;
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > config.rateLimitMaxEvents) {
    return res.status(429).json({
      success: false,
      message: 'Analytics event rate limit exceeded.',
    });
  }

  return next();
};

const isDuplicateAnalyticsEvent = (event) => {
  const config = getAnalyticsConfig();
  const timestamp = now();
  cleanup(dedupeBuckets, timestamp);

  const key = [
    event.event_type,
    event.anon_session_id,
    event.route_path,
    event.content_type || '',
    event.content_id || '',
    event.content_slug || '',
    event.read_depth_percent || '',
    event.search_query || '',
  ].join('|');

  const current = dedupeBuckets.get(key);
  if (current && current.expiresAt > timestamp) {
    return true;
  }

  dedupeBuckets.set(key, {
    expiresAt: timestamp + config.dedupeWindowMs,
  });
  return false;
};

const resetAnalyticsRateLimitState = () => {
  rateBuckets.clear();
  dedupeBuckets.clear();
};

module.exports = {
  analyticsRateLimit,
  isDuplicateAnalyticsEvent,
  resetAnalyticsRateLimitState,
};
