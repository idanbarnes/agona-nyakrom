const { pool } = require('../config/db');

const baseSelect = `
  id,
  title,
  slug,
  excerpt,
  body,
  flyer_image_path,
  flyer_alt_text,
  is_published,
  created_at,
  updated_at
`;

const create = async (data) => {
  const {
    title,
    slug,
    excerpt = null,
    body,
    flyer_image_path = null,
    flyer_alt_text = null,
    is_published = false,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO announcements
      (title, slug, excerpt, body, flyer_image_path, flyer_alt_text, is_published, created_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING ${baseSelect}`,
    [title, slug, excerpt, body, flyer_image_path, flyer_alt_text, is_published]
  );

  return rows[0] || null;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (data.title !== undefined) setField('title', data.title);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.excerpt !== undefined) setField('excerpt', data.excerpt);
  if (data.body !== undefined) setField('body', data.body);
  if (data.flyer_image_path !== undefined) setField('flyer_image_path', data.flyer_image_path);
  if (data.flyer_alt_text !== undefined) setField('flyer_alt_text', data.flyer_alt_text);
  if (data.is_published !== undefined) setField('is_published', data.is_published);

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(id);

  const { rows } = await pool.query(
    `UPDATE announcements
     SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING ${baseSelect}`,
    values
  );

  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
  return rowCount > 0;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM announcements
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM announcements
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const findPublishedBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM announcements
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const buildWhere = ({ search, isPublished } = {}) => {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(title ILIKE $${values.length} OR excerpt ILIKE $${values.length})`);
  }

  if (isPublished !== undefined) {
    values.push(isPublished);
    conditions.push(`is_published = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values };
};

const findAdminList = async ({ search, isPublished, limit, offset } = {}) => {
  const { whereClause, values } = buildWhere({ search, isPublished });

  const listValues = values.slice();
  listValues.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM announcements
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM announcements
     ${whereClause}`,
    values
  );

  return {
    items: rows,
    total: countRows[0]?.count || 0,
  };
};

const findPublicList = async ({ limit, offset } = {}) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM announcements
     WHERE is_published = true
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM announcements
     WHERE is_published = true`
  );

  return {
    items: rows,
    total: countRows[0]?.count || 0,
  };
};

module.exports = {
  create,
  update,
  delete: remove,
  findById,
  findBySlug,
  findPublishedBySlug,
  findAdminList,
  findPublicList,
};
