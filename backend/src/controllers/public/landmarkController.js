const landmarkService = require('../../services/public/landmarkService');
const { getPaginationParams } = require('../../utils/pagination');
const { success, error } = require('../../utils/response');
const { resolvePreviewAccess } = require('../../utils/previewAccess');

// GET /api/public/landmarks
const getAllPublishedLandmarks = async (req, res) => {
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
    console.error('Error fetching landmarks (public):', err.message);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

// GET /api/public/landmarks/:slug
const getPublishedLandmarkBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const preview = resolvePreviewAccess(req, 'landmarks');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      return error(res, preview.errorMessage, 401);
    }

    const landmark = preview.isAuthorized
      ? await landmarkService.findById(preview.previewId)
      : await landmarkService.findBySlug(slug);

    if (!landmark) {
      return error(res, 'Landmark not found', 404);
    }

    return success(res, landmark, 'Landmark fetched successfully');
  } catch (err) {
    console.error('Error fetching landmark (public):', err.message);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

module.exports = {
  getAllPublishedLandmarks,
  getPublishedLandmarkBySlug,
};
