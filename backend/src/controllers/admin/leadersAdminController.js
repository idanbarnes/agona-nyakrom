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
      short_bio_snippet: req.body?.short_bio_snippet ?? null,
      full_bio: req.body?.full_bio ?? null,
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
      short_bio_snippet: req.body?.short_bio_snippet,
      full_bio: req.body?.full_bio,
      slug: req.body?.slug ? buildSlug(req.body.slug) : undefined,
    };

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
  deleteLeader,
};
