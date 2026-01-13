const carouselAdminService = require('../../services/admin/carouselAdminService');
const mediaService = require('../../services/mediaService');
const { getPaginationParams } = require('../../utils/pagination');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'carousel', uniqueId);
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
const createCarouselSlide = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      caption,
      cta_text,
      cta_url,
      display_order,
      published,
    } = req.body || {};

    const imageFile = extractImageFromRequest(req);
    if (!imageFile) {
      return error(res, 'Image is required to create a slide.', 400);
    }

    const imageKey = `slide-${Date.now()}`;
    const images = await processImageIfPresent(imageFile, imageKey);

    const created = await carouselAdminService.create({
      title,
      subtitle,
      caption,
      cta_text,
      cta_url,
      display_order,
      published,
      images,
    });

    return success(res, created, 'Carousel slide created successfully', 201);
  } catch (err) {
    console.error('Error creating carousel slide:', err.message);
    return error(res, 'Failed to create carousel slide', 500);
  }
};

// PUT /update/:id
const updateCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      caption,
      cta_text,
      cta_url,
      display_order,
      published,
    } = req.body || {};

    const updatableFields = [
      'title',
      'subtitle',
      'caption',
      'cta_text',
      'cta_url',
      'display_order',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await carouselAdminService.getById(id);
    if (!existing) {
      return error(res, 'Carousel slide not found', 404);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, existing.id);

    const updated = await carouselAdminService.update(id, {
      title,
      subtitle,
      caption,
      cta_text,
      cta_url,
      display_order,
      published,
      images,
    });

    return success(res, updated, 'Carousel slide updated successfully');
  } catch (err) {
    console.error('Error updating carousel slide:', err.message);
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update carousel slide', 500);
  }
};

// DELETE /delete/:id
const deleteCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await carouselAdminService.getById(id);
    if (!existing) {
      return error(res, 'Carousel slide not found', 404);
    }

    await carouselAdminService.delete(id);
    return success(res, { id }, 'Carousel slide deleted successfully');
  } catch (err) {
    console.error('Error deleting carousel slide:', err.message);
    return error(res, 'Failed to delete carousel slide', 500);
  }
};

// GET /all
const getAllCarouselSlides = async (req, res) => {
  try {
    const { limit, offset, page } = getPaginationParams(req);
    const [items, total] = await Promise.all([
      carouselAdminService.getAll({ limit, offset }),
      carouselAdminService.countAll(),
    ]);

    return success(
      res,
      { items, pagination: { page, limit, total } },
      'Carousel slides fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching carousel slides (admin):', err.message);
    return error(res, 'Failed to fetch carousel slides', 500);
  }
};

// GET /single/:id
const getSingleCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await carouselAdminService.getById(id);
    if (!slide) {
      return error(res, 'Carousel slide not found', 404);
    }
    return success(res, slide, 'Carousel slide fetched successfully');
  } catch (err) {
    console.error('Error fetching carousel slide (single):', err.message);
    return error(res, 'Failed to fetch carousel slide', 500);
  }
};

module.exports = {
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  getAllCarouselSlides,
  getSingleCarouselSlide,
};
