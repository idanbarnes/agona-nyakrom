const asafoService = require('../../services/public/asafoService');
const { success, error } = require('../../utils/response');

// GET /api/public/asafo
const getAllPublishedAsafo = async (req, res) => {
  try {
    const items = await asafoService.findAllPublished();
    return success(res, items, 'Asafo companies fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo companies:', err.message);
    return error(res, 'Failed to fetch asafo companies', 500);
  }
};

// GET /api/public/asafo/:slug
const getPublishedAsafoBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const asafo = await asafoService.findBySlug(slug);
    if (!asafo) {
      return error(res, 'Asafo company not found', 404);
    }
    return success(res, asafo, 'Asafo company fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo company:', err.message);
    return error(res, 'Failed to fetch asafo company', 500);
  }
};

module.exports = {
  getAllPublishedAsafo,
  getPublishedAsafoBySlug,
};
