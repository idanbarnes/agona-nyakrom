const contactCmsService = require('../../services/contactCmsService');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { success, error } = require('../../utils/response');

const getPublicContact = async (req, res) => {
  try {
    const data = await contactCmsService.getContactInfo();
    return success(res, data, 'Contact information fetched successfully');
  } catch (err) {
    console.error('Error fetching public contact info:', err.message);
    return error(res, 'Failed to fetch contact information', 500);
  }
};

const getPublicFaqs = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'faqs');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      return error(res, preview.errorMessage, 401);
    }

    const data = await contactCmsService.listFaqs({
      activeOnly: !preview.isAuthorized,
      status: preview.isAuthorized ? 'all' : 'published',
    });
    return success(res, data, 'FAQs fetched successfully');
  } catch (err) {
    console.error('Error fetching public FAQs:', err.message);
    return error(res, 'Failed to fetch FAQs', 500);
  }
};

const getPublicContactSections = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'faqs');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      return error(res, preview.errorMessage, 401);
    }

    const [contact, faqs] = await Promise.all([
      contactCmsService.getContactInfo(),
      contactCmsService.listFaqs({
        activeOnly: !preview.isAuthorized,
        status: preview.isAuthorized ? 'all' : 'published',
      }),
    ]);

    return success(
      res,
      {
        contact,
        faqs,
      },
      'Contact sections fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching public contact sections:', err.message);
    return error(res, 'Failed to fetch contact sections', 500);
  }
};

module.exports = {
  getPublicContact,
  getPublicFaqs,
  getPublicContactSections,
};
