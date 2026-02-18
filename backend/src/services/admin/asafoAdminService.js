const { pool } = require('../../config/db');
const { sanitizeBody, extractFirstImageSrc, DEFAULT_SHARE_IMAGE } = require('../aboutPageService');

const baseSelect = `
  id,
  name,
  slug,
  history,
  description,
  events,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  entry_type,
  company_key,
  title,
  subtitle,
  body,
  published,
  display_order,
  seo_meta_title,
  seo_meta_description,
  seo_share_image,
  created_at,
  updated_at
`;

const mapAsafo = (row) => {
  if (!row) return null;

  const body = sanitizeBody(row.body || row.history || row.description || '');
  const shareImage =
    row.seo_share_image || extractFirstImageSrc(body) || row.medium_image_path || DEFAULT_SHARE_IMAGE;

  return {
    id: row.id,
    entry_type: row.entry_type || 'company',
    company_key: row.company_key || null,
    title: row.title || row.name || null,
    subtitle: row.subtitle || null,
    body,
    published: Boolean(row.published),
    display_order: Number(row.display_order || 0),
    seo_meta_title: row.seo_meta_title || null,
    seo_meta_description: row.seo_meta_description || null,
    seo_share_image: row.seo_share_image || null,
    share_image: shareImage,
    // compatibility fields
    name: row.name || row.title || null,
    slug: row.slug || row.company_key || null,
    history: row.history || null,
    description: row.description || null,
    events: row.events || null,
    images: {
      original: row.original_image_path || null,
      large: row.large_image_path || null,
      medium: row.medium_image_path || null,
      thumbnail: row.thumbnail_image_path || null,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const normalizeKey = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
};

const listAll = async () => {
  const { rows } = await pool.query(`SELECT ${baseSelect} FROM asafo_companies ORDER BY display_order ASC, created_at ASC`);
  return rows.map(mapAsafo);
};

const getById = async (id) => {
  const { rows } = await pool.query(`SELECT ${baseSelect} FROM asafo_companies WHERE id = $1 LIMIT 1`, [id]);
  return mapAsafo(rows[0]);
};

const hasIntroduction = async () => {
  const { rows } = await pool.query(
    `SELECT id FROM asafo_companies WHERE entry_type = 'introduction' LIMIT 1`
  );
  return rows[0]?.id || null;
};

const createEntry = async (data = {}) => {
  const entryType = data.entry_type === 'introduction' ? 'introduction' : 'company';

  if (entryType === 'introduction') {
    const introId = await hasIntroduction();
    if (introId) {
      const err = new Error('Introduction entry already exists.');
      err.status = 409;
      throw err;
    }
  }

  const companyKey = entryType === 'company' ? normalizeKey(data.company_key || data.slug || data.name) : null;
  const title = data.title || data.name || (entryType === 'introduction' ? 'Introduction' : null);
  const body = sanitizeBody(data.body || data.history || data.description || '');

  const { rows } = await pool.query(
    `INSERT INTO asafo_companies
      (name, slug, history, description, events, original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       entry_type, company_key, title, subtitle, body, published, display_order, seo_meta_title, seo_meta_description, seo_share_image,
       created_at, updated_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())
     RETURNING ${baseSelect}`,
    [
      data.name || title,
      data.slug || companyKey || (entryType === 'introduction' ? 'introduction' : null),
      data.history || null,
      data.description || null,
      data.events || null,
      data.images?.original || null,
      data.images?.large || null,
      data.images?.medium || null,
      data.images?.thumbnail || null,
      entryType,
      companyKey,
      title,
      data.subtitle || null,
      body,
      data.published === true,
      Number.isFinite(Number(data.display_order)) ? Number(data.display_order) : 0,
      data.seo_meta_title || null,
      data.seo_meta_description || null,
      data.seo_share_image || null,
    ]
  );

  return mapAsafo(rows[0]);
};

const updateEntry = async (id, data = {}) => {
  const existing = await getById(id);
  if (!existing) return null;

  const entryType = data.entry_type || existing.entry_type;
  if (entryType === 'introduction') {
    const introId = await hasIntroduction();
    if (introId && introId !== id) {
      const err = new Error('Introduction entry already exists.');
      err.status = 409;
      throw err;
    }
  }

  const next = {
    entry_type: entryType,
    company_key: entryType === 'company' ? normalizeKey(data.company_key ?? existing.company_key) : null,
    title: data.title ?? existing.title,
    subtitle: data.subtitle ?? existing.subtitle,
    body: data.body !== undefined ? sanitizeBody(data.body) : existing.body,
    published: data.published !== undefined ? data.published === true : existing.published,
    display_order:
      data.display_order !== undefined ? Number(data.display_order) : Number(existing.display_order || 0),
    seo_meta_title: data.seo_meta_title ?? existing.seo_meta_title,
    seo_meta_description: data.seo_meta_description ?? existing.seo_meta_description,
    seo_share_image: data.seo_share_image ?? existing.seo_share_image,
    name: data.name ?? existing.name,
    slug: data.slug ?? existing.slug,
    history: data.history ?? existing.history,
    description: data.description ?? existing.description,
    events: data.events ?? existing.events,
    images: {
      original: data.images?.original ?? existing.images?.original,
      large: data.images?.large ?? existing.images?.large,
      medium: data.images?.medium ?? existing.images?.medium,
      thumbnail: data.images?.thumbnail ?? existing.images?.thumbnail,
    },
  };

  const { rows } = await pool.query(
    `UPDATE asafo_companies SET
      name = $1,
      slug = $2,
      history = $3,
      description = $4,
      events = $5,
      original_image_path = $6,
      large_image_path = $7,
      medium_image_path = $8,
      thumbnail_image_path = $9,
      entry_type = $10,
      company_key = $11,
      title = $12,
      subtitle = $13,
      body = $14,
      published = $15,
      display_order = $16,
      seo_meta_title = $17,
      seo_meta_description = $18,
      seo_share_image = $19,
      updated_at = NOW()
     WHERE id = $20
     RETURNING ${baseSelect}`,
    [
      next.name,
      next.slug,
      next.history,
      next.description,
      next.events,
      next.images.original,
      next.images.large,
      next.images.medium,
      next.images.thumbnail,
      next.entry_type,
      next.company_key,
      next.title,
      next.subtitle,
      next.body,
      next.published,
      next.display_order,
      next.seo_meta_title,
      next.seo_meta_description,
      next.seo_share_image,
      id,
    ]
  );

  return mapAsafo(rows[0]);
};

const removeEntry = async (id) => {
  const entry = await getById(id);
  if (!entry) return false;
  if (entry.entry_type === 'introduction') {
    const err = new Error('Introduction entry cannot be deleted.');
    err.status = 400;
    throw err;
  }
  const { rowCount } = await pool.query('DELETE FROM asafo_companies WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { listAll, getById, createEntry, updateEntry, removeEntry };
