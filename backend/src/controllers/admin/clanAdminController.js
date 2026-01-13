const clanAdminService = require('../../services/admin/clanAdminService');
const clanLeaderService = require('../../services/admin/clanLeaderAdminService');
const mediaService = require('../../services/mediaService');
const { requireFields } = require('../../utils/validators');
const { generateSlug } = require('../../utils/slugify');
const { success, error } = require('../../utils/response');

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return {};
  return mediaService.processImage(file, 'clans', uniqueId);
};

// Support multer (req.file) and base64 data URI in req.body.image
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

const groupLeaders = (leaders = []) => {
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

// POST /create
const createClan = async (req, res) => {
  try {
    const { name, intro, history, key_contributions, published } = req.body || {};

    const { valid, missing } = requireFields(req.body || {}, ['name', 'intro', 'history']);
    if (!valid) {
      return error(res, `Missing fields: ${missing.join(', ')}`, 400);
    }

    const slug = generateSlug(name);

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug);

    const created = await clanAdminService.create({
      name,
      slug,
      intro,
      history,
      key_contributions,
      images,
      published,
    });

    return success(res, created, 'Clan created successfully', 201);
  } catch (err) {
    console.error('Error creating clan:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    return error(res, 'Failed to create clan', 500);
  }
};

// PUT /update/:id
const updateClan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, intro, history, key_contributions, published } = req.body || {};

    const updatableFields = ['name', 'intro', 'history', 'key_contributions', 'published'];
    const hasFieldUpdate = updatableFields.some((field) => req.body && req.body[field] !== undefined);
    const hasImageUpdate = Boolean(req.file || typeof req.body?.image === 'string');
    if (!hasFieldUpdate && !hasImageUpdate) {
      return error(res, 'No fields provided to update', 400);
    }

    const existing = await clanAdminService.getById(id);
    if (!existing) {
      return error(res, 'Clan not found', 404);
    }

    let slug = existing.slug;
    if (name) {
      slug = generateSlug(name);
    }

    const imageFile = extractImageFromRequest(req);
    const images = await processImageIfPresent(imageFile, slug || id);

    const updated = await clanAdminService.update(id, {
      name,
      slug,
      intro,
      history,
      key_contributions,
      images,
      published,
    });

    return success(res, updated, 'Clan updated successfully');
  } catch (err) {
    console.error('Error updating clan:', err.message);
    if (err.code === '23505') {
      return error(res, 'Slug already exists. Please choose a different name.', 400);
    }
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update clan', 500);
  }
};

// DELETE /delete/:id
const deleteClan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await clanAdminService.getById(id);
    if (!existing) {
      return error(res, 'Clan not found', 404);
    }

    await clanAdminService.delete(id);
    return success(res, { id }, 'Clan deleted successfully');
  } catch (err) {
    console.error('Error deleting clan:', err.message);
    return error(res, 'Failed to delete clan', 500);
  }
};

// GET /all
const getAllClans = async (req, res) => {
  try {
    const items = await clanAdminService.getAll();
    return success(res, items, 'Clans fetched successfully');
  } catch (err) {
    console.error('Error fetching clans (admin):', err.message);
    return error(res, 'Failed to fetch clans', 500);
  }
};

// GET /single/:id
const getSingleClan = async (req, res) => {
  try {
    const { id } = req.params;
    const clan = await clanAdminService.getById(id);
    if (!clan) {
      return error(res, 'Clan not found', 404);
    }
    const leaders = await clanLeaderService.getByClan(id);
    return success(
      res,
      {
        ...clan,
        leaders: groupLeaders(leaders),
      },
      'Clan fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching clan (single):', err.message);
    return error(res, 'Failed to fetch clan', 500);
  }
};

module.exports = {
  createClan,
  updateClan,
  deleteClan,
  getAllClans,
  getSingleClan,
};
