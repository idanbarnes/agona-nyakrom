const newsService = require('../services/newsService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/news
const getAllNews = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const [items, total] = await Promise.all([
      newsService.findAllNews({ limit, offset }),
      newsService.countAllNews(),
    ]);

    return success(res, { items, page, limit, total }, 'News fetched successfully');
  } catch (err) {
    console.error('Error fetching news:', err.message);
    return error(res, 'Failed to fetch news', 500);
  }
};

// GET /api/news/:slug
const getSingleNews = async (req, res) => {
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
  getAllNews,
  getSingleNews,
};
