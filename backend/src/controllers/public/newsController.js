const newsService = require('../../services/public/newsService');
const { success, error } = require('../../utils/response');
const { resolvePreviewAccess } = require('../../utils/previewAccess');

// GET /api/public/news
const getAllPublishedNews = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const result = await newsService.findPublished({ page, limit });
    return success(res, result, 'News fetched successfully');
  } catch (err) {
    console.error('Error fetching published news:', err.message);
    return error(res, 'Failed to fetch news', 500);
  }
};

// GET /api/public/news/preview?slug=:slug&token=:token
const getPreviewNewsByToken = async (req, res) => {
  try {
    const requestedToken = String(req.query?.token || req.query?.preview_token || '').trim();
    const requestedSlug = String(req.query?.slug || '').trim();

    if (!requestedToken) {
      return error(res, 'Preview token is required.', 400);
    }

    if (!requestedSlug) {
      return error(res, 'News slug is required.', 400);
    }

    const previewRequest = {
      ...req,
      query: {
        ...req.query,
        preview_token: requestedToken,
      },
    };

    const preview = resolvePreviewAccess(previewRequest, 'news');
    if (!preview.isAuthorized) {
      return error(res, preview.errorMessage || 'Invalid or expired preview token.', 401);
    }

    const article = await newsService.findById(preview.previewId);
    if (!article) {
      return error(res, 'News article not found', 404);
    }

    return success(res, article, 'News preview fetched successfully');
  } catch (err) {
    console.error('Error fetching preview news article:', err.message);
    return error(res, 'Failed to fetch preview news article', 500);
  }
};

// GET /api/public/news/:slug
const getPublishedNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const preview = resolvePreviewAccess(req, 'news');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      return error(res, preview.errorMessage, 401);
    }

    const article = preview.isAuthorized
      ? await newsService.findById(preview.previewId)
      : await newsService.findBySlug(slug);

    if (!article) {
      return error(res, 'News article not found', 404);
    }
    return success(res, article, 'News article fetched successfully');
  } catch (err) {
    console.error('Error fetching news article:', err.message);
    return error(res, 'Failed to fetch news article', 500);
  }
};

module.exports = {
  getAllPublishedNews,
  getPreviewNewsByToken,
  getPublishedNewsBySlug,
};
