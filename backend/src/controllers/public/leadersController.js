const leaderService = require('../../services/leaderService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

const getPublishedLeaders = async (req, res) => {
  try {
    const { category } = req.query || {};
    if (category) {
      const { value: filtered, cacheStatus } = await rememberPublicData(
        `public:leaders:list:${String(category).trim().toLowerCase()}`,
        () => leaderService.listPublished(category),
        { ttlMs: 30 * 1000 }
      );
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cacheStatus);
      return success(res, filtered, 'Leaders fetched successfully');
    }

    const { value: data, cacheStatus } = await rememberPublicData(
      'public:leaders:list:grouped',
      () => leaderService.listPublishedGrouped(),
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, data, 'Leaders fetched successfully');
  } catch (err) {
    console.error('Error fetching public leaders:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch leaders', 500);
  }
};

const getPublishedLeaderBySlug = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'leaders');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const { slug } = req.params;
    const loadLeader = async () =>
      (await leaderService.getPublishedBySlug(slug)) ||
      (await leaderService.getPublishedById(slug));
    const cachedResponse = preview.isAuthorized
      ? {
          value: await leaderService.getById(preview.previewId),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          `public:leaders:detail:${slug}`,
          loadLeader,
          { ttlMs: 30 * 1000 }
        );
    const leader = cachedResponse.value;

    if (!leader) {
      setNoStoreHeaders(res);
      return error(res, 'Leader not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }
    return success(res, leader, 'Leader fetched successfully');
  } catch (err) {
    console.error('Error fetching public leader:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch leader', 500);
  }
};

module.exports = {
  getPublishedLeaders,
  getPublishedLeaderBySlug,
};
