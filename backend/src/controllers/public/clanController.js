const clanService = require('../../services/public/clanService');
const { success, error } = require('../../utils/response');

// GET /api/public/clans
const getAllPublishedClans = async (req, res) => {
  try {
    const items = await clanService.findAllPublished();
    return success(res, items, 'Clans fetched successfully');
  } catch (err) {
    console.error('Error fetching clans:', err.message);
    return error(res, 'Failed to fetch clans', 500);
  }
};

// GET /api/public/clans/:slug
const getPublishedClanBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const clan = await clanService.findBySlug(slug);
    if (!clan) {
      return error(res, 'Clan not found', 404);
    }
    return success(res, clan, 'Clan fetched successfully');
  } catch (err) {
    console.error('Error fetching clan:', err.message);
    return error(res, 'Failed to fetch clan', 500);
  }
};

module.exports = {
  getAllPublishedClans,
  getPublishedClanBySlug,
};
