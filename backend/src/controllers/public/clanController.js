const clanService = require('../../services/public/clanService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/clans
const getAllPublishedClans = async (req, res) => {
  try {
    const featured = req.query?.featured === 'true';
    const cacheKey = featured ? 'public:clans:list:featured' : 'public:clans:list';

    const { value: items, cacheStatus } = await rememberPublicData(
      cacheKey,
      () => clanService.findAllPublished({ featured }),
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, items, 'Clans fetched successfully');
  } catch (err) {
    console.error('Error fetching clans:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch clans', 500);
  }
};

// GET /api/public/clans/:slug
const getPublishedClanBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const preview = resolvePreviewAccess(req, 'clans');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const cachedResponse = preview.isAuthorized
      ? {
          value: await clanService.findById(preview.previewId),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          `public:clans:detail:${slug}`,
          () => clanService.findBySlug(slug),
          { ttlMs: 30 * 1000 }
        );
    const clan = cachedResponse.value;

    if (!clan) {
      setNoStoreHeaders(res);
      return error(res, 'Clan not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }
    return success(res, clan, 'Clan fetched successfully');
  } catch (err) {
    console.error('Error fetching clan:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch clan', 500);
  }
};

module.exports = {
  getAllPublishedClans,
  getPublishedClanBySlug,
};
