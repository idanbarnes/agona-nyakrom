const hallOfFameService = require('../../services/public/hallOfFameService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/hall-of-fame
const getAllPublishedHallOfFame = async (req, res) => {
  try {
    const featured = req.query?.featured === 'true';
    const cacheKey = featured
      ? 'public:hall-of-fame:list:featured'
      : 'public:hall-of-fame:list';

    const { value: items, cacheStatus } = await rememberPublicData(
      cacheKey,
      () => hallOfFameService.findAllPublished({ featured }),
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, items, 'Hall of fame entries fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entries:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch hall of fame entries', 500);
  }
};

// GET /api/public/hall-of-fame/:slugOrId
const getPublishedHallOfFameBySlug = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const preview = resolvePreviewAccess(req, 'hall-of-fame');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const cachedResponse = preview.isAuthorized
      ? {
          value: await hallOfFameService.findById(preview.previewId),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          `public:hall-of-fame:detail:${slugOrId}`,
          () => hallOfFameService.findBySlugOrId(slugOrId),
          { ttlMs: 30 * 1000 }
        );
    const entry = cachedResponse.value;

    if (!entry) {
      setNoStoreHeaders(res);
      return error(res, 'Hall of fame entry not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }
    return success(res, entry, 'Hall of fame entry fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entry:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch hall of fame entry', 500);
  }
};

module.exports = {
  getAllPublishedHallOfFame,
  getPublishedHallOfFameBySlug,
};
