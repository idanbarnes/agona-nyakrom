const hallOfFameAdminService = require('../../services/admin/hallOfFameAdminService');
const mediaService = require('../../services/mediaService');
const { isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const parseBoolean = (value) => value === true || value === 'true';

const normalizeText = (value) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || null;
};

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'hall-of-fame', uniqueId);
};

// Support multer uploads and base64 data URIs.
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

const normalizePayload = (body = {}) => {
  const normalizedBody = normalizeText(body.body ?? body.bio ?? body.description ?? body.content);
  const normalizedTitle = normalizeText(body.title ?? body.position ?? body.role);
  const normalizedName = normalizeText(body.name ?? body.full_name);
  const displayOrderRaw = body.display_order;
  const parsedDisplayOrder =
    displayOrderRaw !== undefined && displayOrderRaw !== '' ? Number(displayOrderRaw) : undefined;

  return {
    name: normalizedName,
    title: normalizedTitle,
    body: normalizedBody,
    bio: normalizedBody,
    achievements: normalizeText(body.achievements),
    is_featured:
      body.is_featured !== undefined
        ? parseBoolean(body.is_featured)
        : body.isFeatured !== undefined
        ? parseBoolean(body.isFeatured)
        : undefined,
    display_order:
      Number.isFinite(parsedDisplayOrder) ? parsedDisplayOrder : undefined,
    published:
      body.published !== undefined
        ? parseBoolean(body.published)
        : body.isPublished !== undefined
        ? parseBoolean(body.isPublished)
        : undefined,
  };
};

const createHallOfFame = async (req, res) => {
  try {
    const payload = normalizePayload(req.body || {});

    if (!payload.name) {
      return error(res, 'Name is required.', 400);
    }
    if (!payload.body) {
      return error(res, 'Body is required.', 400);
    }

    const slug = generateSlug(payload.name);
    if (!isValidSlugFormat(slug)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await hallOfFameAdminService.create({
      ...payload,
      slug,
      images,
      published: payload.published ?? false,
      is_featured: payload.is_featured ?? false,
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

const updateHallOfFame = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizePayload(req.body || {});

    const hasFieldUpdate = Object.values(payload).some((value) => value !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await hallOfFameAdminService.getById(id);
    if (!existing) {
      return error(res, 'Hall of fame entry not found', 404);
    }

    let slug = existing.slug;
    if (payload.name) {
      slug = generateSlug(payload.name);
      if (!isValidSlugFormat(slug)) {
        return error(res, 'Invalid slug format', 400);
      }
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await hallOfFameAdminService.update(id, {
      ...payload,
      slug,
      images: Object.keys(images).length > 0 ? images : undefined,
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

const getAllHallOfFame = async (req, res) => {
  try {
    const items = await hallOfFameAdminService.getAll();
    return success(res, items, 'Hall of fame entries fetched successfully');
  } catch (err) {
    console.error('Error fetching hall of fame entries (admin):', err.message);
    return error(res, 'Failed to fetch hall of fame entries', 500);
  }
};

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

const uploadHallOfFameImage = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Image is required', 400);
    const images = await mediaService.processImage(req.file, 'hall-of-fame', `hof-${Date.now()}`);
    return success(res, { image_url: images.large || images.original, images }, 'Image uploaded successfully');
  } catch (err) {
    console.error('Error uploading hall of fame image:', err.message);
    return error(res, err.message || 'Failed to upload image', 500);
  }
};

module.exports = {
  createHallOfFame,
  updateHallOfFame,
  deleteHallOfFame,
  getAllHallOfFame,
  getSingleHallOfFame,
  uploadHallOfFameImage,
};
