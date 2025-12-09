const obituaryService = require('../services/obituaryService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/obituaries
const getAllObituaries = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const [items, total] = await Promise.all([
      obituaryService.findAllObituaries({ limit, offset }),
      obituaryService.countAllObituaries(),
    ]);

    return success(res, { items, page, limit, total }, 'Obituaries fetched successfully');
  } catch (err) {
    console.error('Error fetching obituaries:', err.message);
    return error(res, 'Failed to fetch obituaries', 500);
  }
};

// GET /api/obituaries/:slug
const getSingleObituary = async (req, res) => {
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
  getAllObituaries,
  getSingleObituary,
};
