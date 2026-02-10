const announcementsService = require('../services/announcementsService');
const mediaService = require('../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../utils/validators');
const { generateSlug } = require('../utils/slugify');
const { success, error } = require('../utils/response');

const TITLE_MAX_LENGTH = 255;
const EXCERPT_MAX_LENGTH = 500;
const BODY_MAX_LENGTH = 50000;
const ALT_TEXT_MAX_LENGTH = 255;

const parseBooleanField = (value) => {
  if (value === undefined) return { value: undefined, isValid: true };
  if (typeof value === 'boolean') return { value, isValid: true };
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on'].includes(normalized)) return { value: true, isValid: true };
    if (['false', '0', ''].includes(normalized)) return { value: false, isValid: true };
  }
  if (typeof value === 'number') {
    return { value: value === 1, isValid: value === 0 || value === 1 };
  }
  return { value: undefined, isValid: false };
};

const normalizeSlugInput = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const validateStringLength = (label, value, max) => {
  if (value === undefined || value === null) return null;
  if (String(value).length > max) {
    return `${label} must be ${max} characters or fewer`;
  }
  return null;
};

const processFlyerIfPresent = async (file, uniqueId) => {
  if (!file) return null;
  const images = await mediaService.processImage(file, 'announcements', uniqueId);
  return images.original || images.large || null;
};

const extractImageFromRequest = (req, fieldName) => {
  if (req.file) return req.file;

  const rawImage = req.body?.[fieldName];
  if (typeof rawImage !== 'string') return null;

  const match = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const [, mimetype, base64Payload] = match;
  const buffer = Buffer.from(base64Payload, 'base64');

  return {
    buffer,
    mimetype,
    size: buffer.length,
  };
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, slug: slugInput, excerpt, body, flyer_alt_text, is_published } =
      req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['title', 'body']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const titleError = validateStringLength('Title', title, TITLE_MAX_LENGTH);
    if (titleError) return error(res, titleError, 400);

    const excerptError = validateStringLength('Excerpt', excerpt, EXCERPT_MAX_LENGTH);
    if (excerptError) return error(res, excerptError, 400);

    const bodyError = validateStringLength('Body', body, BODY_MAX_LENGTH);
    if (bodyError) return error(res, bodyError, 400);

    const altError = validateStringLength('Flyer alt text', flyer_alt_text, ALT_TEXT_MAX_LENGTH);
    if (altError) return error(res, altError, 400);

    const slugCandidate = normalizeSlugInput(slugInput) || generateSlug(title);
    if (!isValidSlugFormat(slugCandidate)) {
      return error(res, 'Invalid slug format', 400);
    }

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    const imageFile = extractImageFromRequest(req, 'flyer_image');
    const flyerImagePath = await processFlyerIfPresent(imageFile, slugCandidate);

    const created = await announcementsService.createAnnouncement({
      title,
      slug: slugCandidate,
      excerpt,
      body,
      flyer_image_path: flyerImagePath,
      flyer_alt_text,
      is_published: publishedField.value,
    });

    return success(res, created, 'Announcement created successfully', 201);
  } catch (err) {
    console.error('Error creating announcement:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    return error(res, 'Failed to create announcement', 500);
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug: slugInput, excerpt, body, flyer_alt_text, is_published } =
      req.body || {};

    const updatableFields = ['title', 'slug', 'excerpt', 'body', 'flyer_alt_text', 'is_published'];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.flyer_image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await announcementsService.getAnnouncementById(id);
    if (!existing) {
      return error(res, 'Announcement not found', 404);
    }

    const titleError = validateStringLength('Title', title, TITLE_MAX_LENGTH);
    if (titleError) return error(res, titleError, 400);

    const excerptError = validateStringLength('Excerpt', excerpt, EXCERPT_MAX_LENGTH);
    if (excerptError) return error(res, excerptError, 400);

    const bodyError = validateStringLength('Body', body, BODY_MAX_LENGTH);
    if (bodyError) return error(res, bodyError, 400);

    const altError = validateStringLength('Flyer alt text', flyer_alt_text, ALT_TEXT_MAX_LENGTH);
    if (altError) return error(res, altError, 400);

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    let slugCandidate = existing.slug;
    const normalizedSlugInput = normalizeSlugInput(slugInput);
    if (normalizedSlugInput) {
      slugCandidate = normalizedSlugInput;
    } else if (title) {
      slugCandidate = generateSlug(title);
    }

    if (slugCandidate && !isValidSlugFormat(slugCandidate)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req, 'flyer_image');
    const flyerImagePath = await processFlyerIfPresent(imageFile, slugCandidate || id);

    const updated = await announcementsService.updateAnnouncement(id, {
      title,
      slug: slugCandidate,
      excerpt,
      body,
      flyer_image_path: flyerImagePath !== null ? flyerImagePath : undefined,
      flyer_alt_text,
      is_published: publishedField.value,
    });

    return success(res, updated, 'Announcement updated successfully');
  } catch (err) {
    console.error('Error updating announcement:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update announcement', 500);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await announcementsService.getAnnouncementById(id);
    if (!existing) {
      return error(res, 'Announcement not found', 404);
    }

    await announcementsService.deleteAnnouncement(id);
    return success(res, { id }, 'Announcement deleted successfully');
  } catch (err) {
    console.error('Error deleting announcement:', err.message);
    return error(res, 'Failed to delete announcement', 500);
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const { search, is_published, page, limit } = req.query || {};

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    const result = await announcementsService.listAdminAnnouncements({
      search,
      isPublished: publishedField.value,
      page,
      limit,
    });

    return success(res, result, 'Announcements fetched successfully');
  } catch (err) {
    console.error('Error fetching announcements (admin):', err.message);
    return error(res, 'Failed to fetch announcements', 500);
  }
};

const getSingleAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await announcementsService.getAnnouncementById(id);
    if (!announcement) {
      return error(res, 'Announcement not found', 404);
    }
    return success(res, announcement, 'Announcement fetched successfully');
  } catch (err) {
    console.error('Error fetching announcement (single):', err.message);
    return error(res, 'Failed to fetch announcement', 500);
  }
};

module.exports = {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  getSingleAnnouncement,
};
