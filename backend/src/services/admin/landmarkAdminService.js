const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  slug,
  description,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  published,
  created_at,
  updated_at
`;

const mapLandmark = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    description,
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
    description,
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
    description = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO landmarks
      (name, slug, description,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    name,
    slug,
    description,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapLandmark(rows[0]);
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
  if (data.description !== undefined) setField('description', data.description);
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
    UPDATE landmarks
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapLandmark(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM landmarks WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM landmarks
     ORDER BY created_at DESC`
  );
  return rows.map(mapLandmark);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM landmarks
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapLandmark(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
