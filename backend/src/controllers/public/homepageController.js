// GET /api/public/homepage powers the public homepage; blocks are managed in /admin/homepage-sections and rendered in public-frontend/src/pages/Home.jsx.
const homepageService = require('../../services/public/homepageService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/homepage
const getHomepage = async (req, res) => {
  try {
    const { value: data, cacheStatus } = await rememberPublicData(
      'public:homepage',
      () => homepageService.getHomepage(),
      { ttlMs: 20 * 1000 }
    );
    setPublicCacheHeaders(res, {
      browserSeconds: 30,
      sharedSeconds: 60,
      staleWhileRevalidateSeconds: 120,
    });
    res.set('X-App-Cache', cacheStatus);
    return success(res, data, 'Homepage fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch homepage', 500);
  }
};

module.exports = {
  getHomepage,
};
