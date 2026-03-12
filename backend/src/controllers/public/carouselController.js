const carouselService = require('../../services/public/carouselService');
const { success, error } = require('../../utils/response');
const { resolvePreviewAccess } = require('../../utils/previewAccess');

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
      return error(res, preview.errorMessage, 401);
    }

    const items = await carouselService.findPublished();

    if (!preview.isAuthorized) {
      return success(res, items, 'Carousel slides fetched successfully');
    }

    const previewSlide = await carouselService.findById(preview.previewId);
    if (!previewSlide) {
      return error(res, 'Carousel slide not found for preview.', 404);
    }

    const merged = items.filter((item) => String(item.id) !== String(previewSlide.id));
    merged.push(previewSlide);
    return success(res, sortSlides(merged), 'Carousel preview fetched successfully');
  } catch (err) {
    console.error('Error fetching carousel slides (public):', err.message);
    return error(res, 'Failed to fetch carousel slides', 500);
  }
};

module.exports = {
  getPublishedCarouselSlides,
};
