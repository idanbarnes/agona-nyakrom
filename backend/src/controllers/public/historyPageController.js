const historyPageService = require('../../services/public/historyPageService');
const { success, error } = require('../../utils/response');

// GET /api/public/history
const getPublishedHistoryPage = async (req, res) => {
  try {
    const record = await historyPageService.getPublished();
    if (!record) {
      return error(res, 'History page not available yet', 404);
    }
    return success(res, record, 'History page fetched successfully');
  } catch (err) {
    console.error('Error fetching history page (public):', err.message);
    return error(res, 'Failed to fetch history page', 500);
  }
};

module.exports = {
  getPublishedHistoryPage,
};
