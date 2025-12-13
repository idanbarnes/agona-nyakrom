const obituaryService = require('../../services/public/obituaryService');
const { success, error } = require('../../utils/response');

// GET /api/public/obituaries
const getAllPublishedObituaries = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const result = await obituaryService.findPublished({ page, limit });
    return success(res, result, 'Obituaries fetched successfully');
  } catch (err) {
    console.error('Error fetching published obituaries:', err.message);
    return error(res, 'Failed to fetch obituaries', 500);
  }
};

// GET /api/public/obituaries/:slug
const getPublishedObituaryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const obituary = await obituaryService.findBySlug(slug);
    if (!obituary) {
      return error(res, 'Obituary not found', 404);
    }
    return success(res, obituary, 'Obituary fetched successfully');
  } catch (err) {
    console.error('Error fetching obituary:', err.message);
    return error(res, 'Failed to fetch obituary', 500);
  }
};

module.exports = {
  getAllPublishedObituaries,
  getPublishedObituaryBySlug,
};
