const aboutPageService = require('../../services/aboutPageService');
const { success, error } = require('../../utils/response');

const getPublicAboutPage = async (req, res) => {
  try {
    const page = await aboutPageService.getPublishedBySlug(req.params.slug);
    if (!page) {
      return error(res, 'About page not found', 404);
    }
    return success(res, page, 'About page fetched successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error fetching public about page:', err.message);
    return error(res, 'Failed to fetch about page', 500);
  }
};

module.exports = { getPublicAboutPage };
