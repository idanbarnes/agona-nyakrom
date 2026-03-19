const historyPageService = require('../../services/public/historyPageService');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { success, error } = require('../../utils/response');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/history
const getPublishedHistoryPage = async (req, res) => {
  try {
    const { value: record, cacheStatus } = await rememberPublicData(
      'public:history-page',
      () => historyPageService.getPublished(),
      { ttlMs: 30 * 1000 }
    );
    if (!record) {
      setNoStoreHeaders(res);
      return error(res, 'History page not available yet', 404);
    }
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, record, 'History page fetched successfully');
  } catch (err) {
    console.error('Error fetching history page (public):', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch history page', 500);
  }
};

module.exports = {
  getPublishedHistoryPage,
};
