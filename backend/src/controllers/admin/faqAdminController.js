const contactCmsService = require('../../services/contactCmsService');
const { success, error } = require('../../utils/response');

const getAdminFaqs = async (req, res) => {
  try {
    const { page, limit, search, q, status } = req.query || {};
    const hasPagingOrFilters =
      page !== undefined ||
      limit !== undefined ||
      (search !== undefined && String(search).trim() !== '') ||
      (q !== undefined && String(q).trim() !== '') ||
      (status !== undefined && String(status).trim() !== '');

    const data = await contactCmsService.listFaqs({
      activeOnly: false,
      page,
      limit,
      search: search !== undefined ? search : q,
      status: status || 'all',
      paginated: hasPagingOrFilters,
    });
    return success(res, data, 'FAQs fetched successfully');
  } catch (err) {
    console.error('Error fetching admin FAQs:', err.message);
    return error(res, 'Failed to fetch FAQs', 500);
  }
};

const createAdminFaq = async (req, res) => {
  try {
    const created = await contactCmsService.createFaq(req.body || {}, req.admin?.id || null);
    return success(res, created, 'FAQ created successfully', 201);
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error creating FAQ:', err.message);
    return error(res, 'Failed to create FAQ', 500);
  }
};

const getAdminFaqById = async (req, res) => {
  try {
    const item = await contactCmsService.getFaqById(req.params.id);
    if (!item) {
      return error(res, 'FAQ not found', 404);
    }
    return success(res, item, 'FAQ fetched successfully');
  } catch (err) {
    console.error('Error fetching FAQ:', err.message);
    return error(res, 'Failed to fetch FAQ', 500);
  }
};

const updateAdminFaq = async (req, res) => {
  try {
    const updated = await contactCmsService.updateFaq(
      req.params.id,
      req.body || {},
      req.admin?.id || null
    );

    if (!updated) {
      return error(res, 'FAQ not found', 404);
    }

    return success(res, updated, 'FAQ updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error updating FAQ:', err.message);
    return error(res, 'Failed to update FAQ', 500);
  }
};

const deleteAdminFaq = async (req, res) => {
  try {
    const removed = await contactCmsService.deleteFaq(req.params.id);
    if (!removed) {
      return error(res, 'FAQ not found', 404);
    }
    return success(res, { id: req.params.id }, 'FAQ deleted successfully');
  } catch (err) {
    console.error('Error deleting FAQ:', err.message);
    return error(res, 'Failed to delete FAQ', 500);
  }
};

const reorderAdminFaqs = async (req, res) => {
  try {
    const items = req.body?.items || req.body;
    const updated = await contactCmsService.reorderFaqs(items, req.admin?.id || null);
    return success(res, updated, 'FAQs reordered successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error reordering FAQs:', err.message);
    return error(res, 'Failed to reorder FAQs', 500);
  }
};

const toggleAdminFaqStatus = async (req, res) => {
  try {
    const updated = await contactCmsService.toggleFaq(req.params.id, req.admin?.id || null);
    if (!updated) {
      return error(res, 'FAQ not found', 404);
    }
    return success(res, updated, 'FAQ status updated successfully');
  } catch (err) {
    console.error('Error toggling FAQ status:', err.message);
    return error(res, 'Failed to update FAQ status', 500);
  }
};

const runBulkAction = async (req, res, action) => {
  try {
    const result = await contactCmsService.bulkFaqAction({
      ids: req.body?.ids,
      action,
      adminId: req.admin?.id || null,
    });

    return success(res, result, 'Bulk FAQ action completed successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error running bulk FAQ action:', err.message);
    return error(res, 'Failed to run bulk FAQ action', 500);
  }
};

const bulkAdminFaqAction = async (req, res) => {
  return runBulkAction(req, res, req.body?.action);
};

const bulkDeleteAdminFaqs = async (req, res) => runBulkAction(req, res, 'delete');
const bulkActivateAdminFaqs = async (req, res) => runBulkAction(req, res, 'activate');
const bulkDeactivateAdminFaqs = async (req, res) => runBulkAction(req, res, 'deactivate');

module.exports = {
  getAdminFaqs,
  createAdminFaq,
  getAdminFaqById,
  updateAdminFaq,
  deleteAdminFaq,
  reorderAdminFaqs,
  toggleAdminFaqStatus,
  bulkAdminFaqAction,
  bulkDeleteAdminFaqs,
  bulkActivateAdminFaqs,
  bulkDeactivateAdminFaqs,
};
