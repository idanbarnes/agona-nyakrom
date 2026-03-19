const globalSettingsService = require('../../services/public/globalSettingsService');
const { isTransientDatabaseError } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/global-settings
const getGlobalSettings = async (req, res) => {
  try {
    const { value: settings, cacheStatus } = await rememberPublicData(
      'public:global-settings',
      () => globalSettingsService.getPublished(),
      { ttlMs: 30 * 1000 }
    );
    if (!settings) {
      setNoStoreHeaders(res);
      return error(res, 'Global settings not found', 404);
    }
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, settings, 'Global settings fetched successfully');
  } catch (err) {
    console.error('Error fetching global settings (public):', err.message);
    if (isTransientDatabaseError(err)) {
      setNoStoreHeaders(res);
      return error(res, 'Global settings are temporarily unavailable', 503);
    }
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch global settings', 500);
  }
};

module.exports = {
  getGlobalSettings,
};
