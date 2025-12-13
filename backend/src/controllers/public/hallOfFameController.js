const hallOfFameService = require('../../services/public/hallOfFameService');
const { success, error } = require('../../utils/response');

// GET /api/public/hall-of-fame
const getAllPublishedHallOfFame = async (req, res) => {
  try {
    const items = await hallOfFameService.findAllPublished();
    return success(res, items, 'Hall of fame entries fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entries:', err.message);
    return error(res, 'Failed to fetch hall of fame entries', 500);
  }
};

// GET /api/public/hall-of-fame/:slug
const getPublishedHallOfFameBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const entry = await hallOfFameService.findBySlug(slug);
    if (!entry) {
      return error(res, 'Hall of fame entry not found', 404);
    }
    return success(res, entry, 'Hall of fame entry fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entry:', err.message);
    return error(res, 'Failed to fetch hall of fame entry', 500);
  }
};

module.exports = {
  getAllPublishedHallOfFame,
  getPublishedHallOfFameBySlug,
};
