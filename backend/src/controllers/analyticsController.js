const { getAnalyticsConfig } = require('../config/analytics');
const analyticsService = require('../services/analyticsService');
const {
  isLikelyBot,
  validateAnalyticsEvent,
} = require('../services/analyticsValidationService');
const {
  isDuplicateAnalyticsEvent,
} = require('../middleware/analyticsRateLimit');
const { success, error } = require('../utils/response');

const getPayloadSize = (req) => {
  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > 0) {
    return contentLength;
  }
  try {
    return Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const ingestEvent = async (req, res) => {
  const config = getAnalyticsConfig();
  if (!config.enabled) {
    return res.status(202).json({ success: true, message: 'Analytics disabled.' });
  }

  if (getPayloadSize(req) > config.maxPayloadBytes) {
    return error(res, 'Analytics payload is too large.', 413);
  }

  if (isLikelyBot(req.headers['user-agent'] || '')) {
    return res.status(202).json({ success: true, message: 'Analytics event ignored.' });
  }

  try {
    const currentOrigin = `${req.protocol}://${req.get('host')}`;
    const event = validateAnalyticsEvent(req.body, { currentOrigin });

    if (isDuplicateAnalyticsEvent(event)) {
      return res.status(202).json({ success: true, message: 'Duplicate analytics event ignored.' });
    }

    await analyticsService.createAnalyticsEvent(event);
    return res.status(202).json({ success: true, message: 'Analytics event accepted.' });
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Analytics ingestion failed:', err.message);
    return error(res, 'Analytics event could not be accepted.', 500);
  }
};

const getReport = async (req, res) => {
  try {
    const report = await analyticsService.getAnalyticsReport(req.query || {});
    return success(res, report, 'Analytics report fetched successfully');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Analytics report failed:', err.message);
    return error(res, 'Failed to fetch analytics report', 500);
  }
};

const cleanup = async (req, res) => {
  try {
    const dryRun = String(req.query.dry_run ?? req.query.dryRun ?? 'true') !== 'false';
    const result = await analyticsService.cleanupAnalyticsEvents({
      dryRun,
      retentionDays: req.query.retention_days || req.query.retentionDays,
    });
    return success(res, result, 'Analytics cleanup completed');
  } catch (err) {
    if (err && err.status) {
      return error(res, err.message, err.status);
    }
    console.error('Analytics cleanup failed:', err.message);
    return error(res, 'Failed to run analytics cleanup', 500);
  }
};

module.exports = {
  cleanup,
  getReport,
  ingestEvent,
};
