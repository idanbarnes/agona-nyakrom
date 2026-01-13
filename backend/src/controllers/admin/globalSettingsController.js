const globalSettingsService = require('../../services/admin/globalSettingsService');
const { success, error } = require('../../utils/response');

const parseJsonField = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (parseError) {
      const err = new Error(`Invalid JSON for ${fieldName}.`);
      err.status = 400;
      throw err;
    }
  }
  return value;
};

// GET /api/admin/global-settings
const getGlobalSettings = async (req, res) => {
  try {
    const settings = await globalSettingsService.getCurrent();
    if (!settings) {
      return error(res, 'Global settings not found', 404);
    }
    return success(res, settings, 'Global settings fetched successfully');
  } catch (err) {
    console.error('Error fetching global settings:', err.message);
    return error(res, 'Failed to fetch global settings', 500);
  }
};

// PUT /api/admin/global-settings
const updateGlobalSettings = async (req, res) => {
  try {
    const {
      site_name,
      tagline,
      contact_email,
      contact_phone,
      address,
      social_links: rawSocialLinks,
      navigation_links: rawNavigationLinks,
      footer_text,
      published,
    } = req.body || {};

    const social_links = parseJsonField(rawSocialLinks, 'social_links');
    const navigation_links = parseJsonField(rawNavigationLinks, 'navigation_links');

    const updatableFields = [
      'site_name',
      'tagline',
      'contact_email',
      'contact_phone',
      'address',
      'social_links',
      'navigation_links',
      'footer_text',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    if (!hasFieldUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const updated = await globalSettingsService.update({
      site_name,
      tagline,
      contact_email,
      contact_phone,
      address,
      social_links,
      navigation_links,
      footer_text,
      published,
    });

    return success(res, updated, 'Global settings updated successfully');
  } catch (err) {
    console.error('Error updating global settings:', err.message);
    if (err.status === 400 || err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update global settings', 500);
  }
};

module.exports = {
  getGlobalSettings,
  updateGlobalSettings,
};
