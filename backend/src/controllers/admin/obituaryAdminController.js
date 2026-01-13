const obituaryAdminService = require('../../services/admin/obituaryAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const parseBooleanField = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'on') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === '') {
      return false;
    }
  }
  return Boolean(value);
};

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'obituaries', uniqueId);
};

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
const createObituary = async (req, res) => {
  try {
    const {
      full_name,
      summary,
      biography,
      age,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      published,
    } = req.body || {};

    const publishedValue = parseBooleanField(published);
    const { valid, missing } = requireFields(req.body || {}, ['full_name', 'summary', 'biography']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(full_name);
    if (!isValidSlugFormat(slug)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await obituaryAdminService.create({
      full_name,
      slug,
      age,
      summary,
      biography,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      published: publishedValue,
      images,
    });

    return success(res, created, 'Obituary created successfully', 201);
  } catch (err) {
    console.error('Error creating obituary:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    return error(res, 'Failed to create obituary', 500);
  }
};

// PUT /update/:id
const updateObituary = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      summary,
      biography,
      age,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      published,
    } = req.body || {};

    const publishedValue = parseBooleanField(published);
    const updatableFields = [
      'full_name',
      'summary',
      'biography',
      'age',
      'date_of_birth',
      'date_of_death',
      'burial_date',
      'funeral_date',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await obituaryAdminService.getById(id);
    if (!existing) {
      return error(res, 'Obituary not found', 404);
    }

    let slug = existing.slug;
    if (full_name) {
      slug = generateSlug(full_name);
      if (!isValidSlugFormat(slug)) {
        return error(res, 'Invalid slug format', 400);
      }
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await obituaryAdminService.update(id, {
      full_name,
      slug,
      age,
      summary,
      biography,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      published: publishedValue,
      images,
    });

    return success(res, updated, 'Obituary updated successfully');
  } catch (err) {
    console.error('Error updating obituary:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update obituary', 500);
  }
};

// DELETE /delete/:id
const deleteObituary = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await obituaryAdminService.getById(id);
    if (!existing) {
      return error(res, 'Obituary not found', 404);
    }

    await obituaryAdminService.delete(id);
    return success(res, { id }, 'Obituary deleted successfully');
  } catch (err) {
    console.error('Error deleting obituary:', err.message);
    return error(res, 'Failed to delete obituary', 500);
  }
};

// GET /all
const getAllObituaries = async (req, res) => {
  try {
    const items = await obituaryAdminService.getAll();
    return success(res, items, 'Obituaries fetched successfully');
  } catch (err) {
    console.error('Error fetching obituaries (admin):', err.message);
    return error(res, 'Failed to fetch obituaries', 500);
  }
};

// GET /single/:id
const getSingleObituary = async (req, res) => {
  try {
    const { id } = req.params;
    const obituary = await obituaryAdminService.getById(id);
    if (!obituary) {
      return error(res, 'Obituary not found', 404);
    }
    return success(res, obituary, 'Obituary fetched successfully');
  } catch (err) {
    console.error('Error fetching obituary (single):', err.message);
    return error(res, 'Failed to fetch obituary', 500);
  }
};

module.exports = {
  createObituary,
  updateObituary,
  deleteObituary,
  getAllObituaries,
  getSingleObituary,
};
