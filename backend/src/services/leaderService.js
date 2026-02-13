const { pool } = require('../config/db');

const ALLOWED_CATEGORIES = ['traditional', 'community_admin'];

const baseSelect = `
  id,
  category,
  display_order,
  published,
  role_title,
  name,
  photo,
  short_bio_snippet,
  full_bio,
  slug,
  created_at,
  updated_at
`;

const assertCategory = (category) => {
  if (category !== undefined && category !== null && !ALLOWED_CATEGORIES.includes(category)) {
    const err = new Error('Invalid leader category.');
    err.status = 400;
    throw err;
  }
};

const mapRow = (row) => row || null;

const listAdmin = async (category) => {
  assertCategory(category);
  const values = [];
  let where = '';
  if (category) {
    values.push(category);
    where = 'WHERE category = $1';
  }

  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM leaders
     ${where}
     ORDER BY
      category ASC,
      display_order ASC NULLS LAST,
      created_at ASC`,
    values
  );

  return rows.map(mapRow);
};

const createLeader = async (data) => {
  assertCategory(data.category);
  const {
    category,
    display_order = null,
    published = false,
    role_title = null,
    name = null,
    photo = null,
    short_bio_snippet = null,
    full_bio = null,
    slug,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO leaders
      (category, display_order, published, role_title, name, photo, short_bio_snippet, full_bio, slug, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
     RETURNING ${baseSelect}`,
    [
      category,
      display_order,
      published,
      role_title,
      name,
      photo,
      short_bio_snippet,
      full_bio,
      slug,
    ]
  );

  return mapRow(rows[0]);
};

const getById = async (id) => {
  const { rows } = await pool.query(`SELECT ${baseSelect} FROM leaders WHERE id = $1 LIMIT 1`, [id]);
  return mapRow(rows[0]);
};

const updateLeader = async (id, data) => {
  if (!id) {
    const err = new Error('Leader id is required.');
    err.status = 400;
    throw err;
  }

  assertCategory(data.category);

  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  const updatable = [
    'category',
    'display_order',
    'published',
    'role_title',
    'name',
    'photo',
    'short_bio_snippet',
    'full_bio',
    'slug',
  ];

  for (const key of updatable) {
    if (data[key] !== undefined) {
      setField(key, data[key]);
    }
  }

  if (!fields.length) {
    const err = new Error('No fields provided to update.');
    err.status = 400;
    throw err;
  }

  setField('updated_at', new Date());
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE leaders
     SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING ${baseSelect}`,
    values
  );

  return mapRow(rows[0]);
};

const deleteLeader = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM leaders WHERE id = $1', [id]);
  return rowCount > 0;
};

const listPublished = async (category) => {
  assertCategory(category);
  const values = [];
  let where = 'WHERE published = true';

  if (category) {
    values.push(category);
    where += ' AND category = $1';
  }

  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM leaders
     ${where}
     ORDER BY
      category ASC,
      display_order ASC NULLS LAST,
      created_at ASC`,
    values
  );

  return rows.map(mapRow);
};

const listPublishedGrouped = async () => {
  const rows = await listPublished();
  return {
    traditional: rows.filter((row) => row.category === 'traditional'),
    community_admin: rows.filter((row) => row.category === 'community_admin'),
  };
};

const getPublishedById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM leaders
     WHERE id = $1 AND published = true
     LIMIT 1`,
    [id]
  );
  return mapRow(rows[0]);
};

const getPublishedBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM leaders
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapRow(rows[0]);
};

module.exports = {
  ALLOWED_CATEGORIES,
  listAdmin,
  createLeader,
  updateLeader,
  deleteLeader,
  getById,
  listPublished,
  listPublishedGrouped,
  getPublishedById,
  getPublishedBySlug,
};
