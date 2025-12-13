const newsAdminService = require('../../services/admin/newsAdminService');
const mediaService = require('../../services/mediaService');
const { success, error } = require('../../utils/response');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');

// Helper to build images object if a file is present
const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'news', uniqueId);
};

// Support both multer uploads (req.file) and base64 strings (req.body.image)
const extractImageFromRequest = (req) => {
  if (req.file) return req.file;

  const rawImage = req.body?.image;
  if (typeof rawImage !== 'string') return null;

  // Expect data URI: data:<mime>;base64,<payload>
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
const createNews = async (req, res) => {
  try {
    const { title, content, summary, reporter, published_at, status, tags, categories, published } =
      req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['title', 'content', 'summary']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(title);
    if (!isValidSlugFormat(slug)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await newsAdminService.create({
      title,
      slug,
      summary,
      content,
      reporter,
      published_at,
      status,
      tags,
      categories,
      images,
      published,
    });

    return success(res, created, 'News created successfully', 201);
  } catch (err) {
    console.error('Error creating news:', err.message);
    // Handle unique slug violations gracefully if surfaced
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    return error(res, 'Failed to create news', 500);
  }
};

// PUT /update/:id
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, reporter, published_at, status, tags, categories, published } =
      req.body || {};

    const updatableFields = [
      'title',
      'content',
      'summary',
      'reporter',
      'published_at',
      'status',
      'tags',
      'categories',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await newsAdminService.getById(id);
    if (!existing) {
      return error(res, 'News not found', 404);
    }

    let slug = existing.slug;
    if (title) {
      slug = generateSlug(title);
      if (!isValidSlugFormat(slug)) {
        return error(res, 'Invalid slug format', 400);
      }
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await newsAdminService.update(id, {
      title,
      slug,
      summary,
      content,
      reporter,
      published_at,
      status,
      tags,
      categories,
      published,
      images,
    });

    return success(res, updated, 'News updated successfully');
  } catch (err) {
    console.error('Error updating news:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update news', 500);
  }
};

// DELETE /delete/:id
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await newsAdminService.getById(id);
    if (!existing) {
      return error(res, 'News not found', 404);
    }

    await newsAdminService.delete(id);
    return success(res, { id }, 'News deleted successfully');
  } catch (err) {
    console.error('Error deleting news:', err.message);
    return error(res, 'Failed to delete news', 500);
  }
};

// GET /all
const getAllNews = async (req, res) => {
  try {
    const items = await newsAdminService.getAll();
    return success(res, items, 'News fetched successfully');
  } catch (err) {
    console.error('Error fetching news (admin):', err.message);
    return error(res, 'Failed to fetch news', 500);
  }
};

// GET /single/:id
const getSingleNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await newsAdminService.getById(id);
    if (!news) {
      return error(res, 'News not found', 404);
    }
    return success(res, news, 'News fetched successfully');
  } catch (err) {
    console.error('Error fetching news (single):', err.message);
    return error(res, 'Failed to fetch news', 500);
  }
};

module.exports = {
  createNews,
  updateNews,
  deleteNews,
  getAllNews,
  getSingleNews,
};
