const asafoAdminService = require('../../services/admin/asafoAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'asafo', uniqueId);
};

// Support multer uploads (req.file) and base64 data URI strings (req.body.image)
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
const createAsafo = async (req, res) => {
  try {
    const { name, history, description, events, published } = req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['name', 'history', 'description']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(name);

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await asafoAdminService.create({
      name,
      slug,
      history,
      description,
      events,
      images,
      published,
    });

    return success(res, created, 'Asafo company created successfully', 201);
  } catch (err) {
    console.error('Error creating asafo company:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    return error(res, 'Failed to create asafo company', 500);
  }
};

// PUT /update/:id
const updateAsafo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, history, description, events, published } = req.body || {};

    const updatableFields = ['name', 'history', 'description', 'events', 'published'];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await asafoAdminService.getById(id);
    if (!existing) {
      return error(res, 'Asafo company not found', 404);
    }

    let slug = existing.slug;
    if (name) {
      slug = generateSlug(name);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await asafoAdminService.update(id, {
      name,
      slug,
      history,
      description,
      events,
      images,
      published,
    });

    return success(res, updated, 'Asafo company updated successfully');
  } catch (err) {
    console.error('Error updating asafo company:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update asafo company', 500);
  }
};

// DELETE /delete/:id
const deleteAsafo = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await asafoAdminService.getById(id);
    if (!existing) {
      return error(res, 'Asafo company not found', 404);
    }

    await asafoAdminService.delete(id);
    return success(res, { id }, 'Asafo company deleted successfully');
  } catch (err) {
    console.error('Error deleting asafo company:', err.message);
    return error(res, 'Failed to delete asafo company', 500);
  }
};

// GET /all
const getAllAsafo = async (req, res) => {
  try {
    const items = await asafoAdminService.getAll();
    return success(res, items, 'Asafo companies fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo companies (admin):', err.message);
    return error(res, 'Failed to fetch asafo companies', 500);
  }
};

// GET /single/:id
const getSingleAsafo = async (req, res) => {
  try {
    const { id } = req.params;
    const asafo = await asafoAdminService.getById(id);
    if (!asafo) {
      return error(res, 'Asafo company not found', 404);
    }
    return success(res, asafo, 'Asafo company fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo company (single):', err.message);
    return error(res, 'Failed to fetch asafo company', 500);
  }
};

module.exports = {
  createAsafo,
  updateAsafo,
  deleteAsafo,
  getAllAsafo,
  getSingleAsafo,
};
