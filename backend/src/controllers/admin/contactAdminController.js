const contactCmsService = require('../../services/contactCmsService');
const { success, error } = require('../../utils/response');

const parseJsonField = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (parseError) {
      const err = new Error(`Invalid JSON for ${fieldName}`);
      err.status = 400;
      throw err;
    }
  }
  return value;
};

const getAdminContact = async (req, res) => {
  try {
    const data = await contactCmsService.getContactInfo();
    return success(res, data, 'Contact information fetched successfully');
  } catch (err) {
    console.error('Error fetching admin contact info:', err.message);
    return error(res, 'Failed to fetch contact information', 500);
  }
};

const updateAdminContact = async (req, res) => {
  try {
    const payload = {
      section_title: req.body?.section_title,
      section_subtitle: req.body?.section_subtitle,
      emails: parseJsonField(req.body?.emails, 'emails'),
      phones: parseJsonField(req.body?.phones, 'phones'),
      address: parseJsonField(req.body?.address, 'address'),
      office_hours: parseJsonField(req.body?.office_hours, 'office_hours'),
    };

    const updated = await contactCmsService.upsertContactInfo(payload, req.admin?.id || null);
    return success(res, updated, 'Contact information updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error updating admin contact info:', err.message);
    return error(res, 'Failed to update contact information', 500);
  }
};

const patchEmails = async (req, res) => {
  try {
    const emails = parseJsonField(req.body?.emails, 'emails');
    const updated = await contactCmsService.patchContactInfo(
      { emails },
      req.admin?.id || null
    );
    return success(res, updated, 'Contact emails updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error patching contact emails:', err.message);
    return error(res, 'Failed to update contact emails', 500);
  }
};

const patchPhones = async (req, res) => {
  try {
    const phones = parseJsonField(req.body?.phones, 'phones');
    const updated = await contactCmsService.patchContactInfo(
      { phones },
      req.admin?.id || null
    );
    return success(res, updated, 'Contact phones updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error patching contact phones:', err.message);
    return error(res, 'Failed to update contact phones', 500);
  }
};

const patchAddress = async (req, res) => {
  try {
    const address = parseJsonField(req.body?.address, 'address');
    const updated = await contactCmsService.patchContactInfo(
      { address },
      req.admin?.id || null
    );
    return success(res, updated, 'Contact address updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error patching contact address:', err.message);
    return error(res, 'Failed to update contact address', 500);
  }
};

const patchOfficeHours = async (req, res) => {
  try {
    const officeHours = parseJsonField(req.body?.office_hours, 'office_hours');
    const updated = await contactCmsService.patchContactInfo(
      { office_hours: officeHours },
      req.admin?.id || null
    );
    return success(res, updated, 'Contact office hours updated successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error patching contact office hours:', err.message);
    return error(res, 'Failed to update contact office hours', 500);
  }
};

module.exports = {
  getAdminContact,
  updateAdminContact,
  patchEmails,
  patchPhones,
  patchAddress,
  patchOfficeHours,
};
