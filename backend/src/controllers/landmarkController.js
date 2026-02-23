const landmarkService = require('../services/landmarkService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/landmarks
const getAllLandmarks = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);

    const [items, total] = await Promise.all([
      landmarkService.findAll({ limit, offset }),
      landmarkService.countAll(),
    ]);

    return success(
      res,
      { items, pagination: { page, limit, total } },
      'Landmarks fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching landmarks:', err.message);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

// GET /api/landmarks/:slug
const getLandmarkBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const landmark = await landmarkService.findBySlug(slug);

    if (!landmark) {
      return error(res, 'Landmark not found', 404);
    }

    return success(res, landmark, 'Landmark fetched successfully');
  } catch (err) {
    console.error('Error fetching landmark:', err.message);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

module.exports = {
  getAllLandmarks,
  getLandmarkBySlug,
};
