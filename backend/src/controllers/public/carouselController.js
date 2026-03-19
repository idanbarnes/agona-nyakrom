const carouselService = require('../../services/public/carouselService');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { rememberPublicData } = require('../../utils/publicDataCache');

const sortSlides = (items = []) => {
  return [...items].sort((left, right) => {
    const leftOrder = Number(left?.display_order || 0);
    const rightOrder = Number(right?.display_order || 0);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftCreatedRaw = Date.parse(left?.created_at || '');
    const rightCreatedRaw = Date.parse(right?.created_at || '');
    const leftCreated = Number.isFinite(leftCreatedRaw) ? leftCreatedRaw : 0;
    const rightCreated = Number.isFinite(rightCreatedRaw) ? rightCreatedRaw : 0;
    return rightCreated - leftCreated;
  });
};

// GET /api/public/carousel
const getPublishedCarouselSlides = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'carousel');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const cachedResponse = preview.isAuthorized
      ? {
          value: await carouselService.findPublished(),
          cacheStatus: 'BYPASS',
        }
      : await rememberPublicData(
          'public:carousel:list',
          () => carouselService.findPublished(),
          { ttlMs: 20 * 1000 }
        );
    const items = cachedResponse.value;

    if (!preview.isAuthorized) {
      setPublicCacheHeaders(res, {
        browserSeconds: 30,
        sharedSeconds: 60,
        staleWhileRevalidateSeconds: 120,
      });
      res.set('X-App-Cache', cachedResponse.cacheStatus);
      return success(res, items, 'Carousel slides fetched successfully');
    }

    const previewSlide = await carouselService.findById(preview.previewId);
    if (!previewSlide) {
      return error(res, 'Carousel slide not found for preview.', 404);
    }

    const merged = items.filter((item) => String(item.id) !== String(previewSlide.id));
    merged.push(previewSlide);
    setNoStoreHeaders(res);
    return success(res, sortSlides(merged), 'Carousel preview fetched successfully');
  } catch (err) {
    console.error('Error fetching carousel slides (public):', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch carousel slides', 500);
  }
};

module.exports = {
  getPublishedCarouselSlides,
};
