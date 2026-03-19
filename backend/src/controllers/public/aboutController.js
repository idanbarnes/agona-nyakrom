const aboutPageService = require('../../services/aboutPageService');
const { isTransientDatabaseError } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { resolvePreviewAccess } = require('../../utils/previewAccess');

const getPublicAboutPage = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'about-pages');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const page = preview.isAuthorized
      ? await aboutPageService.getBySlug(preview.previewId)
      : await aboutPageService.getPublishedBySlug(req.params.slug);

    if (!page) {
      setNoStoreHeaders(res);
      return error(res, 'About page not found', 404);
    }
    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
    }
    return success(res, page, 'About page fetched successfully');
  } catch (err) {
    if (err.status === 400) {
      setNoStoreHeaders(res);
      return error(res, err.message, 400);
    }
    console.error('Error fetching public about page:', err.message);
    if (isTransientDatabaseError(err)) {
      setNoStoreHeaders(res);
      return error(res, 'About page is temporarily unavailable', 503);
    }
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch about page', 500);
  }
};

module.exports = { getPublicAboutPage };
