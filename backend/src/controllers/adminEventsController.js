const eventsService = require('../services/eventsService');
const mediaService = require('../services/mediaService');
const { requireFields, isValidSlugFormat } = require('../utils/validators');
const { generateSlug } = require('../utils/slugify');
const { success, error } = require('../utils/response');

const TITLE_MAX_LENGTH = 255;
const EXCERPT_MAX_LENGTH = 500;
const BODY_MAX_LENGTH = 50000;
const ALT_TEXT_MAX_LENGTH = 255;
const TAG_MAX_LENGTH = 80;

const parseBooleanField = (value) => {
  if (value === undefined) return { value: undefined, isValid: true };
  if (typeof value === 'boolean') return { value, isValid: true };
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on'].includes(normalized)) return { value: true, isValid: true };
    if (['false', '0', ''].includes(normalized)) return { value: false, isValid: true };
  }
  if (typeof value === 'number') {
    return { value: value === 1, isValid: value === 0 || value === 1 };
  }
  return { value: undefined, isValid: false };
};

const parseOptionalDate = (value) => {
  if (value === undefined) return { provided: false, value: undefined, isValid: true };
  if (value === null) return { provided: true, value: null, isValid: true };
  if (typeof value === 'string' && value.trim() === '') {
    return { provided: true, value: null, isValid: true };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { provided: true, value: undefined, isValid: false };
  }

  return { provided: true, value: parsed.toISOString().slice(0, 10), isValid: true };
};

const isValidDateQuery = (value) => {
  if (value === undefined || value === null || value === '') return true;
  return parseOptionalDate(value).isValid;
};

const normalizeSlugInput = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const validateStringLength = (label, value, max) => {
  if (value === undefined || value === null) return null;
  if (String(value).length > max) {
    return `${label} must be ${max} characters or fewer`;
  }
  return null;
};

const normalizeTagInput = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim().replace(/\s+/g, ' ');
  return trimmed.length ? trimmed : null;
};

const processFlyerIfPresent = async (file, uniqueId) => {
  if (!file) return null;
  const images = await mediaService.processImage(file, 'events', uniqueId);
  return images.original || images.large || null;
};

const extractImageFromRequest = (req, fieldName) => {
  if (req.file) return req.file;

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

const createEvent = async (req, res) => {
  try {
    const {
      title,
      slug: slugInput,
      excerpt,
      body,
      event_date,
      flyer_alt_text,
      is_published,
      event_tag,
    } = req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['title']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const titleError = validateStringLength('Title', title, TITLE_MAX_LENGTH);
    if (titleError) return error(res, titleError, 400);

    const excerptError = validateStringLength('Excerpt', excerpt, EXCERPT_MAX_LENGTH);
    if (excerptError) return error(res, excerptError, 400);

    const bodyError = validateStringLength('Body', body, BODY_MAX_LENGTH);
    if (bodyError) return error(res, bodyError, 400);

    const altError = validateStringLength('Flyer alt text', flyer_alt_text, ALT_TEXT_MAX_LENGTH);
    if (altError) return error(res, altError, 400);

    const normalizedTag = normalizeTagInput(event_tag);
    const tagError = validateStringLength('Event tag', normalizedTag, TAG_MAX_LENGTH);
    if (tagError) return error(res, tagError, 400);

    const parsedDate = parseOptionalDate(event_date);
    if (!parsedDate.isValid) {
      return error(res, 'event_date must be a valid date', 400);
    }

    const slugCandidate = normalizeSlugInput(slugInput) || generateSlug(title);
    if (!isValidSlugFormat(slugCandidate)) {
      return error(res, 'Invalid slug format', 400);
    }

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    const imageFile = extractImageFromRequest(req, 'flyer_image');
    const flyerImagePath = await processFlyerIfPresent(imageFile, slugCandidate);

    const created = await eventsService.createEvent({
      title,
      slug: slugCandidate,
      excerpt,
      body,
      event_tag: normalizedTag,
      event_date: parsedDate.value,
      flyer_image_path: flyerImagePath,
      flyer_alt_text,
      is_published: publishedField.value,
    });

    return success(res, created, 'Event created successfully', 201);
  } catch (err) {
    console.error('Error creating event:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    return error(res, 'Failed to create event', 500);
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: slugInput,
      excerpt,
      body,
      event_date,
      flyer_alt_text,
      is_published,
      event_tag,
    } = req.body || {};

    const updatableFields = [
      'title',
      'slug',
      'excerpt',
      'body',
      'event_tag',
      'event_date',
      'flyer_alt_text',
      'is_published',
    ];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.flyer_image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await eventsService.getEventById(id);
    if (!existing) {
      return error(res, 'Event not found', 404);
    }

    const titleError = validateStringLength('Title', title, TITLE_MAX_LENGTH);
    if (titleError) return error(res, titleError, 400);

    const excerptError = validateStringLength('Excerpt', excerpt, EXCERPT_MAX_LENGTH);
    if (excerptError) return error(res, excerptError, 400);

    const bodyError = validateStringLength('Body', body, BODY_MAX_LENGTH);
    if (bodyError) return error(res, bodyError, 400);

    const altError = validateStringLength('Flyer alt text', flyer_alt_text, ALT_TEXT_MAX_LENGTH);
    if (altError) return error(res, altError, 400);

    const normalizedTag = normalizeTagInput(event_tag);
    const tagError = validateStringLength('Event tag', normalizedTag, TAG_MAX_LENGTH);
    if (tagError) return error(res, tagError, 400);

    const parsedDate = parseOptionalDate(event_date);
    if (!parsedDate.isValid) {
      return error(res, 'event_date must be a valid date', 400);
    }

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    let slugCandidate = existing.slug;
    const normalizedSlugInput = normalizeSlugInput(slugInput);
    if (normalizedSlugInput) {
      slugCandidate = normalizedSlugInput;
    } else if (title) {
      slugCandidate = generateSlug(title);
    }

    if (slugCandidate && !isValidSlugFormat(slugCandidate)) {
      return error(res, 'Invalid slug format', 400);
    }

    const imageFile = extractImageFromRequest(req, 'flyer_image');
    const flyerImagePath = await processFlyerIfPresent(imageFile, slugCandidate || id);

    const updated = await eventsService.updateEvent(id, {
      title,
      slug: slugCandidate,
      excerpt,
      body,
      event_tag: normalizedTag,
      event_date: parsedDate.provided ? parsedDate.value : undefined,
      flyer_image_path: flyerImagePath !== null ? flyerImagePath : undefined,
      flyer_alt_text,
      is_published: publishedField.value,
    });

    return success(res, updated, 'Event updated successfully');
  } catch (err) {
    console.error('Error updating event:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different title.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update event', 500);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await eventsService.getEventById(id);
    if (!existing) {
      return error(res, 'Event not found', 404);
    }

    await eventsService.deleteEvent(id);
    return success(res, { id }, 'Event deleted successfully');
  } catch (err) {
    console.error('Error deleting event:', err.message);
    return error(res, 'Failed to delete event', 500);
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { search, is_published, state, date_from, date_to, tag, page, limit } =
      req.query || {};

    const publishedField = parseBooleanField(is_published);
    if (!publishedField.isValid) {
      return error(res, 'is_published must be a boolean', 400);
    }

    const normalizedState = state ? String(state).trim().toLowerCase() : undefined;
    if (
      normalizedState &&
      !['coming_soon', 'upcoming', 'past'].includes(normalizedState)
    ) {
      return error(res, 'state must be coming_soon, upcoming, or past', 400);
    }

    if (!isValidDateQuery(date_from) || !isValidDateQuery(date_to)) {
      return error(res, 'date_from and date_to must be valid dates', 400);
    }

    const result = await eventsService.listAdminEvents({
      search,
      isPublished: publishedField.value,
      state: normalizedState,
      dateFrom: date_from || undefined,
      dateTo: date_to || undefined,
      tag: tag ? String(tag).trim() : undefined,
      page,
      limit,
    });

    return success(res, result, 'Events fetched successfully');
  } catch (err) {
    console.error('Error fetching events (admin):', err.message);
    return error(res, 'Failed to fetch events', 500);
  }
};

const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventsService.getEventById(id);
    if (!event) {
      return error(res, 'Event not found', 404);
    }
    return success(res, event, 'Event fetched successfully');
  } catch (err) {
    console.error('Error fetching event (single):', err.message);
    return error(res, 'Failed to fetch event', 500);
  }
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getSingleEvent,
};
