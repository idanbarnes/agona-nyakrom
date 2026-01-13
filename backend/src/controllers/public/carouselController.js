const carouselService = require('../../services/public/carouselService');
const { success, error } = require('../../utils/response');

// GET /api/public/carousel
const getPublishedCarouselSlides = async (req, res) => {
  try {
    const items = await carouselService.findPublished();
    return success(res, items, 'Carousel slides fetched successfully');
  } catch (err) {
    console.error('Error fetching carousel slides (public):', err.message);
    return error(res, 'Failed to fetch carousel slides', 500);
  }
};

module.exports = {
  getPublishedCarouselSlides,
};
