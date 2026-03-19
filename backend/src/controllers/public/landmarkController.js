const landmarkService = require('../../services/public/landmarkService');
const { getPaginationParams } = require('../../utils/pagination');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

// GET /api/public/landmarks
const getAllPublishedLandmarks = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const cacheKey = `public:landmarks:list:page=${page}:limit=${limit}`;

    const { value: payload, cacheStatus } = await rememberPublicData(
      cacheKey,
      async () => {
        const [items, total] = await Promise.all([
          landmarkService.findAll({ limit, offset }),
          landmarkService.countAll(),
        ]);

        return { items, total };
      },
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);

    return success(
      res,
      { items: payload.items, pagination: { page, limit, total: payload.total } },
      'Landmarks fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching landmarks (public):', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

// GET /api/public/landmarks/:slug
const getPublishedLandmarkBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const preview = resolvePreviewAccess(req, 'landmarks');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const cachedResponse = preview.isAuthorized
      ? {
          value: await landmarkService.findById(preview.previewId),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          `public:landmarks:detail:${slug}`,
          () => landmarkService.findBySlug(slug),
          { ttlMs: 30 * 1000 }
        );
    const landmark = cachedResponse.value;

    if (!landmark) {
      setNoStoreHeaders(res);
      return error(res, 'Landmark not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }

    return success(res, landmark, 'Landmark fetched successfully');
  } catch (err) {
    console.error('Error fetching landmark (public):', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

module.exports = {
  getAllPublishedLandmarks,
  getPublishedLandmarkBySlug,
};
