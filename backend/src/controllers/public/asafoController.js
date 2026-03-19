const asafoService = require('../../services/public/asafoService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

const getAllPublishedAsafo = async (req, res) => {
  try {
    const { value: items, cacheStatus } = await rememberPublicData(
      'public:asafo:list',
      () => asafoService.findAllPublished(),
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, items, 'Asafo entries fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entries:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch asafo entries', 500);
  }
};

const getPublishedAsafoBySlug = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'asafo-companies');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const { slug } = req.params;
    const cachedResponse = preview.isAuthorized
      ? {
          value: await asafoService.findById(preview.previewId),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          `public:asafo:detail:${slug}`,
          () => asafoService.findBySlug(slug),
          { ttlMs: 30 * 1000 }
        );
    const asafo = cachedResponse.value;

    if (!asafo) {
      setNoStoreHeaders(res);
      return error(res, 'Asafo entry not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }
    return success(res, asafo, 'Asafo entry fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entry:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch asafo entry', 500);
  }
};

module.exports = { getAllPublishedAsafo, getPublishedAsafoBySlug };
