const settingsService = require('../services/settingsService');
const { success, error } = require('../utils/response');

// GET /api/history
const getHistory = async (req, res) => {
  try {
    const history = await settingsService.getHistory();
    if (!history) {
      return error(res, 'Record not found', 404);
    }
    return success(res, history, 'History fetched successfully');
  } catch (err) {
    console.error('Error fetching history:', err.message);
    return error(res, 'Failed to fetch history', 500);
  }
};

// GET /api/global-settings
const getGlobalSettings = async (req, res) => {
  try {
    const settings = await settingsService.getGlobalSettings();
    if (!settings) {
      return error(res, 'Record not found', 404);
    }
    return success(res, settings, 'Global settings fetched successfully');
  } catch (err) {
    console.error('Error fetching global settings:', err.message);
    return error(res, 'Failed to fetch global settings', 500);
  }
};

module.exports = {
  getHistory,
  getGlobalSettings,
};
