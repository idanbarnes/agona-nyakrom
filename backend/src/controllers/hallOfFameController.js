const hallOfFameService = require('../services/hallOfFameService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/hall-of-fame
const getAllHeroes = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const featured = req.query?.featured === 'true';

    const [items, total] = await Promise.all([
      hallOfFameService.findAll({ limit, offset, featured }),
      hallOfFameService.countAll({ featured }),
    ]);

    return success(
      res,
      { items, pagination: { page, limit, total } },
      'Hall of fame heroes fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching hall of fame heroes:', err.message);
    return error(res, 'Failed to fetch hall of fame heroes', 500);
  }
};

// GET /api/hall-of-fame/:slugOrId
const getHeroBySlug = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const hero = await hallOfFameService.findBySlugOrId(slugOrId);

    if (!hero) {
      return error(res, 'Hero not found', 404);
    }

    return success(res, hero, 'Hero fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame hero:', err.message);
    return error(res, 'Failed to fetch hall of fame hero', 500);
  }
};

module.exports = {
  getAllHeroes,
  getHeroBySlug,
};
