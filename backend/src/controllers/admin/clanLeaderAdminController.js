const clanLeaderService = require('../../services/admin/clanLeaderAdminService');
const clanAdminService = require('../../services/admin/clanAdminService');
const mediaService = require('../../services/mediaService');
const { success, error } = require('../../utils/response');

// Leader types are constrained to current/past.
const VALID_TYPES = new Set(['current', 'past']);

const normalizeType = (value) => (value ? String(value).toLowerCase().trim() : '');

const parseDisplayOrder = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
};

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'clans', uniqueId);
};

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

const buildLeadersPayload = (leaders) => {
  const grouped = { current: [], past: [] };
  leaders.forEach((leader) => {
    if (leader?.type === 'past') {
      grouped.past.push(leader);
    } else {
      grouped.current.push(leader);
    }
  });
  return grouped;
};

// POST /api/admin/clans/:clanId/leaders
const createLeader = async (req, res) => {
  try {
    const { clanId } = req.params;
    const { type, name, title, position, display_order } = req.body || {};

    const clan = await clanAdminService.getById(clanId);
    if (!clan) {
      return error(res, 'Clan not found', 404);
    }

    const normalizedType = normalizeType(type);
    if (!VALID_TYPES.has(normalizedType)) {
      return error(res, 'Invalid leader type', 400);
    }

    if (!position || !String(position).trim()) {
      return error(res, 'Position is required', 400);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(
      imageFile,
      `leader-${clanId}-${Date.now()}`
    );

    const created = await clanLeaderService.create({
      clan_id: clanId,
      type: normalizedType,
      name: name ? String(name).trim() : null,
      title: title ? String(title).trim() : null,
      position: String(position).trim(),
      display_order: parseDisplayOrder(display_order),
      images,
    });

    return success(res, created, 'Clan leader created successfully', 201);
  } catch (err) {
    console.error('Error creating clan leader:', err.message);
    return error(res, 'Failed to create clan leader', 500);
  }
};

// PUT /api/admin/clans/:clanId/leaders/:leaderId
const updateLeader = async (req, res) => {
  try {
    const { clanId, leaderId } = req.params;
    const { type, name, title, position, display_order } = req.body || {};

    const leader = await clanLeaderService.getById(leaderId);
    if (!leader || leader.clan_id !== clanId) {
      return error(res, 'Clan leader not found', 404);
    }

    const normalizedType = type !== undefined ? normalizeType(type) : undefined;
    if (normalizedType !== undefined && !VALID_TYPES.has(normalizedType)) {
      return error(res, 'Invalid leader type', 400);
    }

    const hasFieldUpdate = [
      type,
      name,
      title,
      position,
      display_order,
    ].some((field) => field !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    if (position !== undefined && !String(position).trim()) {
      return error(res, 'Position is required', 400);
    }

    let nextDisplayOrder = parseDisplayOrder(display_order);
    if (normalizedType && normalizedType !== leader.type && nextDisplayOrder === undefined) {
      // If moving types without order, append to the end of the new type.
      nextDisplayOrder = await clanLeaderService.getNextDisplayOrder(clanId, normalizedType);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(
      imageFile,
      `leader-${leaderId}-${Date.now()}`
    );

    const updated = await clanLeaderService.update(leaderId, {
      type: normalizedType,
      name: name !== undefined ? String(name).trim() : undefined,
      title: title !== undefined ? String(title).trim() : undefined,
      position: position !== undefined ? String(position).trim() : undefined,
      display_order: nextDisplayOrder,
      images: Object.keys(images).length ? images : undefined,
    });

    return success(res, updated, 'Clan leader updated successfully');
  } catch (err) {
    console.error('Error updating clan leader:', err.message);
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update clan leader', 500);
  }
};

// DELETE /api/admin/clans/:clanId/leaders/:leaderId
const deleteLeader = async (req, res) => {
  try {
    const { clanId, leaderId } = req.params;
    const leader = await clanLeaderService.getById(leaderId);
    if (!leader || leader.clan_id !== clanId) {
      return error(res, 'Clan leader not found', 404);
    }

    await clanLeaderService.delete(leaderId);
    return success(res, { id: leaderId }, 'Clan leader deleted successfully');
  } catch (err) {
    console.error('Error deleting clan leader:', err.message);
    return error(res, 'Failed to delete clan leader', 500);
  }
};

// PATCH /api/admin/clans/:clanId/leaders/reorder
const reorderLeaders = async (req, res) => {
  try {
    const { clanId } = req.params;
    const { current = [], past = [] } = req.body || {};

    const clan = await clanAdminService.getById(clanId);
    if (!clan) {
      return error(res, 'Clan not found', 404);
    }

    await clanLeaderService.reorder(clanId, { current, past });
    const leaders = await clanLeaderService.getByClan(clanId);
    return success(
      res,
      { leaders: buildLeadersPayload(leaders) },
      'Clan leaders reordered successfully'
    );
  } catch (err) {
    console.error('Error reordering clan leaders:', err.message);
    if (
      err.message === 'Leader list does not match clan records.' ||
      err.message === 'Leader type mismatch for reorder.'
    ) {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to reorder clan leaders', 500);
  }
};

module.exports = {
  createLeader,
  updateLeader,
  deleteLeader,
  reorderLeaders,
};
