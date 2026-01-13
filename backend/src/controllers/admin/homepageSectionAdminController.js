const homepageSectionAdminService = require('../../services/admin/homepageSectionAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'homepage', uniqueId);
};

// Support multer uploads and base64 data URIs
const extractImageFromRequest = (req) => {
  if (req.file) return req.file;

  const rawImage = req.body?.image;
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

// POST /create
const createHomepageSection = async (req, res) => {
  try {
    const { section_key, title, content, display_order, published } = req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['section_key']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    if (!isValidSlugFormat(section_key)) {
      return error(res, 'Invalid section_key format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, section_key);

    const created = await homepageSectionAdminService.create({
      section_key,
      title,
      content,
      display_order,
      published,
      images,
    });

    return success(res, created, 'Homepage section created successfully', 201);
  } catch (err) {
    console.error('Error creating homepage section:', err.message);
    if (err.code === '23505') {
      return error(res, 'section_key already exists. Please choose a different key.', 400);
    }
    return error(res, 'Failed to create homepage section', 500);
  }
};

// PUT /update/:id
const updateHomepageSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { section_key, title, content, display_order, published } = req.body || {};

    const updatableFields = ['section_key', 'title', 'content', 'display_order', 'published'];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await homepageSectionAdminService.getById(id);
    if (!existing) {
      return error(res, 'Homepage section not found', 404);
    }

    let keyToUse = existing.section_key;
    if (section_key) {
      if (!isValidSlugFormat(section_key)) {
        return error(res, 'Invalid section_key format', 400);
      }
      keyToUse = section_key;
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, keyToUse || id);

    const updated = await homepageSectionAdminService.update(id, {
      section_key,
      title,
      content,
      display_order,
      published,
      images,
    });

    return success(res, updated, 'Homepage section updated successfully');
  } catch (err) {
    console.error('Error updating homepage section:', err.message);
    if (err.code === '23505') {
      return error(res, 'section_key already exists. Please choose a different key.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update homepage section', 500);
  }
};

// DELETE /delete/:id
const deleteHomepageSection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await homepageSectionAdminService.getById(id);
    if (!existing) {
      return error(res, 'Homepage section not found', 404);
    }

    await homepageSectionAdminService.delete(id);
    return success(res, { id }, 'Homepage section deleted successfully');
  } catch (err) {
    console.error('Error deleting homepage section:', err.message);
    return error(res, 'Failed to delete homepage section', 500);
  }
};

// GET /all
const getAllHomepageSections = async (req, res) => {
  try {
    const items = await homepageSectionAdminService.getAll();
    return success(res, items, 'Homepage sections fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage sections (admin):', err.message);
    return error(res, 'Failed to fetch homepage sections', 500);
  }
};

// GET /single/:id
const getSingleHomepageSection = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await homepageSectionAdminService.getById(id);
    if (!item) {
      return error(res, 'Homepage section not found', 404);
    }
    return success(res, item, 'Homepage section fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage section (single):', err.message);
    return error(res, 'Failed to fetch homepage section', 500);
  }
};

module.exports = {
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  getAllHomepageSections,
  getSingleHomepageSection,
};
