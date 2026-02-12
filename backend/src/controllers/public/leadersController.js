const leaderService = require('../../services/leaderService');
const { success, error } = require('../../utils/response');

const getPublishedLeaders = async (req, res) => {
  try {
    const data = await leaderService.listPublishedGrouped();
    return success(res, data, 'Leaders fetched successfully');
  } catch (err) {
    console.error('Error fetching public leaders:', err.message);
    return error(res, 'Failed to fetch leaders', 500);
  }
};

const getPublishedLeaderBySlug = async (req, res) => {
  try {
    const leader = await leaderService.getPublishedBySlug(req.params.slug);
    if (!leader) {
      return error(res, 'Leader not found', 404);
    }
    return success(res, leader, 'Leader fetched successfully');
  } catch (err) {
    console.error('Error fetching public leader:', err.message);
    return error(res, 'Failed to fetch leader', 500);
  }
};

module.exports = {
  getPublishedLeaders,
  getPublishedLeaderBySlug,
};
