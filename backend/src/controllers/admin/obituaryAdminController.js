const obituaryAdminService = require('../../services/admin/obituaryAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { computeAgeFromDates } = require('../../utils/age');
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

const normalizeOptionalUrl = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

// File picker metadata can leak as "photo.jpg" into URL fields; reject these.
const isBareFilename = (value) =>
  typeof value === 'string' && /^[^/\\]+\.[a-z0-9]{2,6}$/i.test(value.trim());

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'obituaries', uniqueId);
};

const extractImageFromRequest = (req, fieldName = 'image') => {
  if (req.file && fieldName === 'image') return req.file;
  if (req.files?.[fieldName]?.[0]) return req.files[fieldName][0];

  const rawImage = req.body?.[fieldName];
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
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      visitation_date,
      visitation_location,
      funeral_location,
      burial_location,
      deceased_photo_url,
      poster_image_url,
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

    const imageFile = extractImageFromRequest(req, 'image');
    const deceasedImageFile = extractImageFromRequest(req, 'deceased_image');
    const images = await processImageIfPresent(imageFile, slug);
    const deceasedImages = await processImageIfPresent(
      deceasedImageFile,
      `${slug}-deceased`
    );

    const normalizedDeceasedPhotoUrl = normalizeOptionalUrl(deceased_photo_url);
    const normalizedPosterImageUrl = normalizeOptionalUrl(poster_image_url);
    const resolvedDeceasedPhotoUrl = deceasedImageFile
      ? deceasedImages?.medium || deceasedImages?.original || null
      : isBareFilename(normalizedDeceasedPhotoUrl)
        ? null
        : normalizedDeceasedPhotoUrl || null;
    const resolvedPosterImageUrl = imageFile
      ? images?.medium || images?.original || null
        : isBareFilename(normalizedPosterImageUrl)
        ? null
        : normalizedPosterImageUrl || null;
    const computedAge = computeAgeFromDates(date_of_birth, date_of_death);

    const created = await obituaryAdminService.create({
      full_name,
      slug,
      age: computedAge,
      summary,
      biography,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      visitation_date,
      visitation_location,
      funeral_location,
      burial_location,
      deceased_photo_url: resolvedDeceasedPhotoUrl,
      poster_image_url: resolvedPosterImageUrl,
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
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      visitation_date,
      visitation_location,
      funeral_location,
      burial_location,
      deceased_photo_url,
      poster_image_url,
      published,
    } = req.body || {};

    const publishedValue = parseBooleanField(published);
    const updatableFields = [
      'full_name',
      'summary',
      'biography',
      'date_of_birth',
      'date_of_death',
      'burial_date',
      'funeral_date',
      'visitation_date',
      'visitation_location',
      'funeral_location',
      'burial_location',
      'deceased_photo_url',
      'poster_image_url',
      'published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(
      req.file ||
      req.files?.image?.[0] ||
      req.files?.deceased_image?.[0] ||
      typeof req.body?.image === 'string' ||
      typeof req.body?.deceased_image === 'string'
    );
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

    const imageFile = extractImageFromRequest(req, 'image');
    const deceasedImageFile = extractImageFromRequest(req, 'deceased_image');
    const images = await processImageIfPresent(imageFile, slug || id);
    const deceasedImages = await processImageIfPresent(
      deceasedImageFile,
      `${slug || id}-deceased`
    );

    const normalizedDeceasedPhotoUrl = normalizeOptionalUrl(deceased_photo_url);
    const normalizedPosterImageUrl = normalizeOptionalUrl(poster_image_url);
    const resolvedDeceasedPhotoUrl = deceasedImageFile
      ? deceasedImages?.medium || deceasedImages?.original
      : isBareFilename(normalizedDeceasedPhotoUrl)
        ? undefined
        : normalizedDeceasedPhotoUrl;
    const resolvedPosterImageUrl = imageFile
      ? images?.medium || images?.original
      : isBareFilename(normalizedPosterImageUrl)
        ? undefined
        : normalizedPosterImageUrl;
    const effectiveDateOfBirth = date_of_birth !== undefined ? date_of_birth : existing.date_of_birth;
    const effectiveDateOfDeath = date_of_death !== undefined ? date_of_death : existing.date_of_death;
    const computedAge = computeAgeFromDates(effectiveDateOfBirth, effectiveDateOfDeath);

    const updated = await obituaryAdminService.update(id, {
      full_name,
      slug,
      age: computedAge,
      summary,
      biography,
      date_of_birth,
      date_of_death,
      burial_date,
      funeral_date,
      visitation_date,
      visitation_location,
      funeral_location,
      burial_location,
      deceased_photo_url: resolvedDeceasedPhotoUrl,
      poster_image_url: resolvedPosterImageUrl,
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
