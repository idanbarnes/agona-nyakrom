const historyPageService = require('../../services/admin/historyPageService');
const mediaService = require('../../services/mediaService');
const { requireFields } = require('../../utils/validators');
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

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'history', uniqueId);
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

// GET /api/admin/history
const getHistoryPage = async (req, res) => {
  try {
    const record = await historyPageService.getCurrent();
    return success(res, record, 'History page fetched successfully');
  } catch (err) {
    console.error('Error fetching history page (admin):', err.message);
    return error(res, 'Failed to fetch history page', 500);
  }
};

// PUT /api/admin/history
const upsertHistoryPage = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      content,
      highlights: rawHighlights,
      published,
    } = req.body || {};

    const highlights = parseJsonField(rawHighlights, 'highlights');

    const existing = await historyPageService.getCurrent();
    const imageFile = extractImageFromRequest(req);
    const hasImageUpdate = Boolean(imageFile);

    if (!existing) {
      const { valid, missing } = requireFields(req.body || {}, ['title', 'content']);
      if (!valid) {
        return error(res, `Missing fields: ${missing.join(', ')}`, 400);
      }

      const images = await processImageIfPresent(imageFile, `history-${Date.now()}`);
      const created = await historyPageService.create({
        title,
        subtitle,
        content,
        highlights,
        published,
        images,
      });
      return success(res, created, 'History page created successfully', 201);
    }

    const updatableFields = ['title', 'subtitle', 'content', 'highlights', 'published'];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const images = await processImageIfPresent(imageFile, existing.id);
    const updated = await historyPageService.update(existing.id, {
      title,
      subtitle,
      content,
      highlights,
      published,
      images,
    });

    return success(res, updated, 'History page updated successfully');
  } catch (err) {
    console.error('Error updating history page (admin):', err.message);
    if (err.status === 400 || err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update history page', 500);
  }
};

module.exports = {
  getHistoryPage,
  upsertHistoryPage,
};
