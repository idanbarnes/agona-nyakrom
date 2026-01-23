// GET /api/public/homepage powers the public homepage; blocks are managed in /admin/homepage-sections and rendered in public-frontend/src/pages/Home.jsx.
const homepageService = require('../../services/public/homepageService');
const { success, error } = require('../../utils/response');

// GET /api/public/homepage
const getHomepage = async (req, res) => {
  try {
    const data = await homepageService.getHomepage();
    return success(res, data, 'Homepage fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage:', err.message);
    return error(res, 'Failed to fetch homepage', 500);
  }
};

module.exports = {
  getHomepage,
};
