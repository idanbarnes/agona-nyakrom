const asafoService = require('../services/asafoService');
const { getPaginationParams } = require('../utils/pagination');
const { success, error } = require('../utils/response');

// GET /api/asafo-companies
const getAllAsafoCompanies = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const [items, total] = await Promise.all([
      asafoService.findAll({ limit, offset }),
      asafoService.countAll(),
    ]);

    const pagination = { page, limit, total };
    return success(
      res,
      { items, pagination },
      'Asafo companies fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching Asafo companies:', err.message);
    return error(res, 'Failed to fetch Asafo companies', 500);
  }
};

// GET /api/asafo-companies/:slug
const getAsafoCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await asafoService.findBySlug(slug);

    if (!company) {
      return error(res, 'Asafo company not found', 404);
    }

    return success(res, company, 'Asafo company fetched successfully');
  } catch (err) {
    console.error('Error fetching Asafo company:', err.message);
    return error(res, 'Failed to fetch Asafo company', 500);
  }
};

module.exports = {
  getAllAsafoCompanies,
  getAsafoCompanyBySlug,
};
