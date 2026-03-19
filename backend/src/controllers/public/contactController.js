const contactCmsService = require('../../services/contactCmsService');
const { resolvePreviewAccess } = require('../../utils/previewAccess');
const { success, error } = require('../../utils/response');
const { setNoStoreHeaders, setPublicCacheHeaders } = require('../../utils/cacheHeaders');
const { rememberPublicData } = require('../../utils/publicDataCache');

const getPublicContact = async (req, res) => {
  try {
    const { value: data, cacheStatus } = await rememberPublicData(
      'public:contact',
      () => contactCmsService.getContactInfo(),
      { ttlMs: 30 * 1000 }
    );
    setPublicCacheHeaders(res);
    res.set('X-App-Cache', cacheStatus);
    return success(res, data, 'Contact information fetched successfully');
  } catch (err) {
    console.error('Error fetching public contact info:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch contact information', 500);
  }
};

const getPublicFaqs = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'faqs');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const cacheKey = 'public:faqs';
    const loadFaqs = () =>
      contactCmsService.listFaqs({
        activeOnly: !preview.isAuthorized,
        status: preview.isAuthorized ? 'all' : 'published',
      });
    const cachedResponse = preview.isAuthorized
      ? { value: await loadFaqs(), cacheStatus: 'BYPASS' }
      : await rememberPublicData(cacheKey, loadFaqs, { ttlMs: 30 * 1000 });
    const data = cachedResponse.value;

    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }
    return success(res, data, 'FAQs fetched successfully');
  } catch (err) {
    console.error('Error fetching public FAQs:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch FAQs', 500);
  }
};

const getPublicContactSections = async (req, res) => {
  try {
    const preview = resolvePreviewAccess(req, 'faqs');
    if (preview.isPreviewRequest && !preview.isAuthorized) {
      setNoStoreHeaders(res);
      return error(res, preview.errorMessage, 401);
    }

    const loadContactSections = async () => {
      const [contact, faqs] = await Promise.all([
        contactCmsService.getContactInfo(),
        contactCmsService.listFaqs({
          activeOnly: !preview.isAuthorized,
          status: preview.isAuthorized ? 'all' : 'published',
        }),
      ]);

      return {
        contact,
        faqs,
      };
    };
    const cachedResponse = preview.isAuthorized
      ? { value: await loadContactSections(), cacheStatus: 'BYPASS' }
      : await rememberPublicData(
          'public:contact-sections',
          loadContactSections,
          { ttlMs: 30 * 1000 }
        );
    const data = cachedResponse.value;

    if (preview.isAuthorized) {
      setNoStoreHeaders(res);
    } else {
      setPublicCacheHeaders(res);
      res.set('X-App-Cache', cachedResponse.cacheStatus);
    }

    return success(
      res,
      data,
      'Contact sections fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching public contact sections:', err.message);
    setNoStoreHeaders(res);
    return error(res, 'Failed to fetch contact sections', 500);
  }
};

module.exports = {
  getPublicContact,
  getPublicFaqs,
  getPublicContactSections,
};
