const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  slug,
  title,
  bio,
  achievements,
  is_featured,
  display_order,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  published,
  created_at,
  updated_at
`;

const mapHallOfFame = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    title,
    bio,
    achievements,
    is_featured,
    display_order,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    published,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    name,
    slug,
    title,
    bio,
    achievements,
    is_featured,
    display_order,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
    },
    published,
    created_at,
    updated_at,
  };
};

const create = async (data) => {
  const {
    name,
    slug,
    title = null,
    bio = null,
    achievements = null,
    is_featured = false,
    display_order = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO hall_of_fame
      (name, slug, title, bio, achievements, is_featured, display_order,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    name,
    slug,
    title,
    bio,
    achievements,
    is_featured,
    display_order,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapHallOfFame(rows[0]);
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

  if (data.name !== undefined) setField('name', data.name);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.title !== undefined) setField('title', data.title);
  if (data.bio !== undefined) setField('bio', data.bio);
  if (data.achievements !== undefined) setField('achievements', data.achievements);
  if (data.is_featured !== undefined) setField('is_featured', data.is_featured);
  if (data.display_order !== undefined) setField('display_order', data.display_order);
  if (data.published !== undefined) setField('published', data.published);

  if (data.images) {
    const { original, large, medium, thumbnail } = data.images;
    if (original !== undefined) setField('original_image_path', original);
    if (large !== undefined) setField('large_image_path', large);
    if (medium !== undefined) setField('medium_image_path', medium);
    if (thumbnail !== undefined) setField('thumbnail_image_path', thumbnail);
  }

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(id);

  const query = `
    UPDATE hall_of_fame
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapHallOfFame(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM hall_of_fame WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     ORDER BY created_at DESC`
  );
  return rows.map(mapHallOfFame);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapHallOfFame(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
