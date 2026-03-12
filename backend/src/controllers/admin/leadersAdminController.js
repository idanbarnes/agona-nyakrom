const leaderService = require('../../services/leaderService');
const mediaService = require('../../services/mediaService');
const { success, error } = require('../../utils/response');

const buildSlug = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const parseBoolean = (value) => value === true || value === 'true';

const normalizeNullableText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSnippet = (value) => {
  const plain = stripHtml(value);
  return plain ? plain.slice(0, 220) : null;
};

const listLeaders = async (req, res) => {
  try {
    const data = await leaderService.listAdmin(req.query?.category);
    return success(res, data, 'Leaders fetched successfully');
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    console.error('Error listing leaders:', err.message);
    return error(res, 'Failed to fetch leaders', 500);
  }
};

const createLeader = async (req, res) => {
  try {
    const richBody = normalizeNullableText(req.body?.body);
    const legacyFullBio = normalizeNullableText(req.body?.full_bio);
    const legacyShortBio = normalizeNullableText(req.body?.short_bio_snippet);
    const fullBio = richBody !== undefined ? richBody : legacyFullBio ?? legacyShortBio ?? null;
    const shortBio =
      richBody !== undefined
        ? buildSnippet(richBody)
        : legacyShortBio ?? buildSnippet(legacyFullBio) ?? null;

    const payload = {
      category: req.body?.category,
      display_order:
        req.body?.display_order === '' || req.body?.display_order === undefined
          ? null
          : Number(req.body.display_order),
      published: parseBoolean(req.body?.published),
      role_title: req.body?.role_title ?? null,
      name: req.body?.name ?? null,
      photo: null,
      short_bio_snippet: shortBio,
      full_bio: fullBio,
      slug: req.body?.slug ? buildSlug(req.body.slug) : buildSlug(req.body?.name || req.body?.role_title || `leader-${Date.now()}`),
    };

    if (req.file) {
      const images = await mediaService.processImage(req.file, 'leaders', `leader-${Date.now()}`);
      payload.photo = images.large || images.original;
    }

    const created = await leaderService.createLeader(payload);
    return success(res, created, 'Leader created successfully', 201);
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    console.error('Error creating leader:', err.message);
    return error(res, 'Failed to create leader', 500);
  }
};

const updateLeader = async (req, res) => {
  try {
    const richBody = normalizeNullableText(req.body?.body);
    const payload = {
      category: req.body?.category,
      display_order:
        req.body?.display_order === ''
          ? null
          : req.body?.display_order !== undefined
            ? Number(req.body.display_order)
            : undefined,
      published: req.body?.published !== undefined ? parseBoolean(req.body.published) : undefined,
      role_title: req.body?.role_title,
      name: req.body?.name,
      slug: req.body?.slug ? buildSlug(req.body.slug) : undefined,
    };

    if (richBody !== undefined) {
      payload.full_bio = richBody;
      payload.short_bio_snippet = buildSnippet(richBody);
    } else {
      if (req.body?.full_bio !== undefined) {
        const legacyFullBio = normalizeNullableText(req.body.full_bio);
        payload.full_bio = legacyFullBio;
        if (req.body?.short_bio_snippet === undefined) {
          payload.short_bio_snippet = buildSnippet(legacyFullBio);
        }
      }

      if (req.body?.short_bio_snippet !== undefined) {
        payload.short_bio_snippet = normalizeNullableText(req.body.short_bio_snippet);
      }
    }

    if (req.file) {
      const images = await mediaService.processImage(req.file, 'leaders', `leader-${Date.now()}`);
      payload.photo = images.large || images.original;
    } else if (req.body?.photo !== undefined) {
      payload.photo = req.body.photo || null;
    }

    const updated = await leaderService.updateLeader(req.params.id, payload);
    if (!updated) {
      return error(res, 'Leader not found', 404);
    }
    return success(res, updated, 'Leader updated successfully');
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    console.error('Error updating leader:', err.message);
    return error(res, 'Failed to update leader', 500);
  }
};

const uploadLeaderImage = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Image is required', 400);
    const images = await mediaService.processImage(req.file, 'leaders', `leader-inline-${Date.now()}`);
    return success(
      res,
      { image_url: images.large || images.original, images },
      'Image uploaded successfully'
    );
  } catch (err) {
    console.error('Error uploading leader image:', err.message);
    return error(res, err.message || 'Failed to upload image', 500);
  }
};


const toggleLeaderPublish = async (req, res) => {
  try {
    const updated = await leaderService.updateLeader(req.params.id, {
      published: parseBoolean(req.body?.published),
    });

    if (!updated) {
      return error(res, 'Leader not found', 404);
    }

    return success(res, updated, 'Leader publish status updated successfully');
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    console.error('Error updating leader publish status:', err.message);
    return error(res, 'Failed to update publish status', 500);
  }
};

const setLeaderDisplayOrder = async (req, res) => {
  try {
    const displayOrder =
      req.body?.display_order === '' || req.body?.display_order === undefined
        ? null
        : Number(req.body.display_order);

    const updated = await leaderService.updateLeader(req.params.id, {
      display_order: displayOrder,
    });

    if (!updated) {
      return error(res, 'Leader not found', 404);
    }

    return success(res, updated, 'Leader display order updated successfully');
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    console.error('Error updating leader display order:', err.message);
    return error(res, 'Failed to update display order', 500);
  }
};

const deleteLeader = async (req, res) => {
  try {
    const removed = await leaderService.deleteLeader(req.params.id);
    if (!removed) {
      return error(res, 'Leader not found', 404);
    }
    return success(res, null, 'Leader deleted successfully');
  } catch (err) {
    console.error('Error deleting leader:', err.message);
    return error(res, 'Failed to delete leader', 500);
  }
};

module.exports = {
  listLeaders,
  createLeader,
  updateLeader,
  uploadLeaderImage,
  toggleLeaderPublish,
  setLeaderDisplayOrder,
  deleteLeader,
};
