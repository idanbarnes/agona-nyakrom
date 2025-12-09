const clanService = require('../services/clanService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/clans
const getAllClans = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const [items, total] = await Promise.all([
      clanService.findAllClans({ limit, offset }),
      clanService.countAllClans(),
    ]);

    return success(res, { items, page, limit, total }, 'Clans fetched successfully');
  } catch (err) {
    console.error('Error fetching clans:', err.message);
    return error(res, 'Failed to fetch clans', 500);
  }
};

// GET /api/clans/:slug
const getSingleClan = async (req, res) => {
  try {
    const { slug } = req.params;
    const clan = await clanService.findBySlugWithLeaders(slug);

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
  getAllClans,
  getSingleClan,
};
