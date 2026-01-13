const globalSettingsService = require('../../services/public/globalSettingsService');
const { success, error } = require('../../utils/response');

// GET /api/public/global-settings
const getGlobalSettings = async (req, res) => {
  try {
    const settings = await globalSettingsService.getPublished();
    if (!settings) {
      return error(res, 'Global settings not found', 404);
    }
    return success(res, settings, 'Global settings fetched successfully');
  } catch (err) {
    console.error('Error fetching global settings (public):', err.message);
    return error(res, 'Failed to fetch global settings', 500);
  }
};

module.exports = {
  getGlobalSettings,
};
