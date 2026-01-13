const landmarkAdminService = require('../../services/admin/landmarkAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'landmarks', uniqueId);
};

// Support multer uploads and base64 data URI strings in req.body.image
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
const createLandmark = async (req, res) => {
  try {
    const {
      name,
      title,
      category,
      description,
      address: rawAddress,
      location,
      latitude,
      longitude,
      video_url: rawVideoUrl,
      google_map_link,
      published,
    } = req.body || {};

    const address = rawAddress ?? location ?? null;
    const video_url = rawVideoUrl ?? google_map_link ?? null;

    const { valid, missing } = requireFields(req.body || {}, ['name']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(name);
    if (!isValidSlugFormat(slug)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await landmarkAdminService.create({
      name,
      slug,
      title,
      category,
      description,
      address,
      latitude,
      longitude,
      video_url,
      images,
      published,
    });

    return success(res, created, 'Landmark created successfully', 201);
  } catch (err) {
    console.error('Error creating landmark:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    return error(res, 'Failed to create landmark', 500);
  }
};

// PUT /update/:id
const updateLandmark = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      category,
      description,
      address: rawAddress,
      location,
      latitude,
      longitude,
      video_url: rawVideoUrl,
      google_map_link,
      published,
    } = req.body || {};

    const address = rawAddress ?? location ?? null;
    const video_url = rawVideoUrl ?? google_map_link ?? null;

    const updatableFields = [
      'name',
      'title',
      'category',
      'description',
      'address',
      'latitude',
      'longitude',
      'video_url',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await landmarkAdminService.getById(id);
    if (!existing) {
      return error(res, 'Landmark not found', 404);
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

    const updated = await landmarkAdminService.update(id, {
      name,
      slug,
      title,
      category,
      description,
      address,
      latitude,
      longitude,
      video_url,
      images,
      published,
    });

    return success(res, updated, 'Landmark updated successfully');
  } catch (err) {
    console.error('Error updating landmark:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update landmark', 500);
  }
};

// DELETE /delete/:id
const deleteLandmark = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await landmarkAdminService.getById(id);
    if (!existing) {
      return error(res, 'Landmark not found', 404);
    }

    await landmarkAdminService.delete(id);
    return success(res, { id }, 'Landmark deleted successfully');
  } catch (err) {
    console.error('Error deleting landmark:', err.message);
    return error(res, 'Failed to delete landmark', 500);
  }
};

// GET /all
const getAllLandmarks = async (req, res) => {
  try {
    const items = await landmarkAdminService.getAll();
    return success(res, items, 'Landmarks fetched successfully');
  } catch (err) {
    console.error('Error fetching landmarks (admin):', err.message);
    return error(res, 'Failed to fetch landmarks', 500);
  }
};

// GET /single/:id
const getSingleLandmark = async (req, res) => {
  try {
    const { id } = req.params;
    const landmark = await landmarkAdminService.getById(id);
    if (!landmark) {
      return error(res, 'Landmark not found', 404);
    }
    return success(res, landmark, 'Landmark fetched successfully');
  } catch (err) {
    console.error('Error fetching landmark (single):', err.message);
    return error(res, 'Failed to fetch landmark', 500);
  }
};

module.exports = {
  createLandmark,
  updateLandmark,
  deleteLandmark,
  getAllLandmarks,
  getSingleLandmark,
};
