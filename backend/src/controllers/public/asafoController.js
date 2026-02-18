const asafoService = require('../../services/public/asafoService');
const { success, error } = require('../../utils/response');

const getAllPublishedAsafo = async (req, res) => {
  try {
    const items = await asafoService.findAllPublished();
    return success(res, items, 'Asafo entries fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entries:', err.message);
    return error(res, 'Failed to fetch asafo entries', 500);
  }
};

const getPublishedAsafoBySlug = async (req, res) => {
  try {
    const asafo = await asafoService.findBySlug(req.params.slug);
    if (!asafo) {
      return error(res, 'Asafo entry not found', 404);
    }
    return success(res, asafo, 'Asafo entry fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entry:', err.message);
    return error(res, 'Failed to fetch asafo entry', 500);
  }
};

module.exports = { getAllPublishedAsafo, getPublishedAsafoBySlug };
