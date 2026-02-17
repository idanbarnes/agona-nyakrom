const asafoAdminService = require('../../services/admin/asafoAdminService');
const mediaService = require('../../services/mediaService');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'asafo', uniqueId);
};

const extractImageFromRequest = (req) => {
  if (req.file) return req.file;
  const rawImage = req.body?.image;
  if (typeof rawImage !== 'string') return null;
  const match = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const [, mimetype, base64Payload] = match;
  const buffer = Buffer.from(base64Payload, 'base64');
  return { buffer, mimetype, size: buffer.length };
};

const normalizePayload = (body = {}) => ({
  entry_type: body.entry_type,
  company_key: body.company_key,
  title: body.title,
  subtitle: body.subtitle,
  body: body.body,
  published: body.published === true || body.published === 'true',
  display_order: body.display_order,
  seo_meta_title: body.seo_meta_title,
  seo_meta_description: body.seo_meta_description,
  seo_share_image: body.seo_share_image,
  // compatibility fields
  name: body.name,
  slug: body.slug,
  history: body.history,
  description: body.description,
  events: body.events,
});

const listAsafoEntries = async (req, res) => {
  try {
    const items = await asafoAdminService.listAll();
    return success(res, items, 'Asafo entries fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entries (admin):', err.message);
    return error(res, 'Failed to fetch asafo entries', 500);
  }
};

const createAsafoEntry = async (req, res) => {
  try {
    const payload = normalizePayload(req.body || {});
    if (!payload.entry_type) payload.entry_type = 'company';

    if (!payload.title && !payload.name) {
      return error(res, 'title is required', 400);
    }

    if (payload.entry_type === 'company' && !payload.company_key) {
      payload.company_key = generateSlug(payload.title || payload.name);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, payload.company_key || payload.entry_type || 'asafo');

    const created = await asafoAdminService.createEntry({ ...payload, images });
    return success(res, created, 'Asafo entry created successfully', 201);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    if (err.code === '23505') {
      return error(res, 'Duplicate company key or introduction already exists.', 409);
    }
    console.error('Error creating asafo entry:', err.message);
    return error(res, 'Failed to create asafo entry', 500);
  }
};

const updateAsafoEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await asafoAdminService.getById(id);
    if (!existing) return error(res, 'Asafo entry not found', 404);

    const payload = normalizePayload(req.body || {});
    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, payload.company_key || existing.company_key || existing.id);

    const updated = await asafoAdminService.updateEntry(id, {
      ...payload,
      images: Object.keys(images).length ? images : undefined,
    });

    return success(res, updated, 'Asafo entry updated successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    if (err.code === '23505') {
      return error(res, 'Duplicate company key or introduction already exists.', 409);
    }
    console.error('Error updating asafo entry:', err.message);
    return error(res, 'Failed to update asafo entry', 500);
  }
};

const deleteAsafoEntry = async (req, res) => {
  try {
    const deleted = await asafoAdminService.removeEntry(req.params.id);
    if (!deleted) return error(res, 'Asafo entry not found', 404);
    return success(res, { id: req.params.id }, 'Asafo entry deleted successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    console.error('Error deleting asafo entry:', err.message);
    return error(res, 'Failed to delete asafo entry', 500);
  }
};

const getSingleAsafoEntry = async (req, res) => {
  try {
    const asafo = await asafoAdminService.getById(req.params.id);
    if (!asafo) return error(res, 'Asafo entry not found', 404);
    return success(res, asafo, 'Asafo entry fetched successfully');
  } catch (err) {
    console.error('Error fetching asafo entry (single):', err.message);
    return error(res, 'Failed to fetch asafo entry', 500);
  }
};

const uploadAsafoImage = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Image is required', 400);
    const images = await mediaService.processImage(req.file, 'asafo', `asafo-${Date.now()}`);
    return success(res, { image_url: images.large || images.original, images }, 'Image uploaded successfully');
  } catch (err) {
    console.error('Error uploading asafo image:', err.message);
    return error(res, err.message || 'Failed to upload image', 500);
  }
};

module.exports = {
  listAsafoEntries,
  createAsafoEntry,
  updateAsafoEntry,
  deleteAsafoEntry,
  getSingleAsafoEntry,
  uploadAsafoImage,
  // backward-compatible names
  getAllAsafo: listAsafoEntries,
  createAsafo: createAsafoEntry,
  updateAsafo: updateAsafoEntry,
  deleteAsafo: deleteAsafoEntry,
  getSingleAsafo: getSingleAsafoEntry,
};
