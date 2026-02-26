const leaderService = require('../../services/leaderService');
const { success, error } = require('../../utils/response');
const { resolvePreviewAccess } = require('../../utils/previewAccess');

const getPublishedLeaders = async (req, res) => {
  try {
    const { category } = req.query || {};
    if (category) {
      const filtered = await leaderService.listPublished(category);
      return success(res, filtered, 'Leaders fetched successfully');
    }

    const data = await leaderService.listPublishedGrouped();
    return success(res, data, 'Leaders fetched successfully');
  } catch (err) {
    console.error('Error fetching public leaders:', err.message);
    return error(res, 'Failed to fetch leaders', 500);
  }
};

const getPublishedLeaderBySlug = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'leaders');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      return error(res, preview.errorMessage, 401);
    }

    const leader = preview.isAuthorized
      ? await leaderService.getById(preview.previewId)
      : (await leaderService.getPublishedBySlug(req.params.slug)) ||
        (await leaderService.getPublishedById(req.params.slug));

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
