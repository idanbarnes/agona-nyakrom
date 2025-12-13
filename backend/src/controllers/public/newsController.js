const newsService = require('../../services/public/newsService');
const { success, error } = require('../../utils/response');

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

// GET /api/public/news/:slug
const getPublishedNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await newsService.findBySlug(slug);
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
  getPublishedNewsBySlug,
};
