const hallOfFameAdminService = require('../../services/admin/hallOfFameAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'hall-of-fame', uniqueId);
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
const createHallOfFame = async (req, res) => {
  try {
    const { name, title, bio, achievements, is_featured, display_order, published } = req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['name', 'bio']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(name);
    if (!isValidSlugFormat(slug)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await hallOfFameAdminService.create({
      name,
      slug,
      title,
      bio,
      achievements,
      is_featured,
      display_order,
      images,
      published,
    });

    return success(res, created, 'Hall of fame entry created successfully', 201);
  } catch (err) {
    console.error('Error creating hall of fame entry:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    return error(res, 'Failed to create hall of fame entry', 500);
  }
};

// PUT /update/:id
const updateHallOfFame = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, bio, achievements, is_featured, display_order, published } = req.body || {};

    const updatableFields = [
      'name',
      'title',
      'bio',
      'achievements',
      'is_featured',
      'display_order',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await hallOfFameAdminService.getById(id);
    if (!existing) {
      return error(res, 'Hall of fame entry not found', 404);
    }

    let slug = existing.slug;
    if (name) {
      slug = generateSlug(name);
      if (!isValidSlugFormat(slug)) {
        return error(res, 'Invalid slug format', 400);
      }
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await hallOfFameAdminService.update(id, {
      name,
      slug,
      title,
      bio,
      achievements,
      is_featured,
      display_order,
      images,
      published,
    });

    return success(res, updated, 'Hall of fame entry updated successfully');
  } catch (err) {
    console.error('Error updating hall of fame entry:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update hall of fame entry', 500);
  }
};

// DELETE /delete/:id
const deleteHallOfFame = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await hallOfFameAdminService.getById(id);
    if (!existing) {
      return error(res, 'Hall of fame entry not found', 404);
    }

    await hallOfFameAdminService.delete(id);
    return success(res, { id }, 'Hall of fame entry deleted successfully');
  } catch (err) {
    console.error('Error deleting hall of fame entry:', err.message);
    return error(res, 'Failed to delete hall of fame entry', 500);
  }
};

// GET /all
const getAllHallOfFame = async (req, res) => {
  try {
    const items = await hallOfFameAdminService.getAll();
    return success(res, items, 'Hall of fame entries fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entries (admin):', err.message);
    return error(res, 'Failed to fetch hall of fame entries', 500);
  }
};

// GET /single/:id
const getSingleHallOfFame = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await hallOfFameAdminService.getById(id);
    if (!item) {
      return error(res, 'Hall of fame entry not found', 404);
    }
    return success(res, item, 'Hall of fame entry fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entry (single):', err.message);
    return error(res, 'Failed to fetch hall of fame entry', 500);
  }
};

module.exports = {
  createHallOfFame,
  updateHallOfFame,
  deleteHallOfFame,
  getAllHallOfFame,
  getSingleHallOfFame,
};
