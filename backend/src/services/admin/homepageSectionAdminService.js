const { pool } = require('../../config/db');

const baseSelect = `
  id,
  section_key,
  title,
  content,
  display_order,
  published,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  created_at,
  updated_at
`;

const mapSection = (row) => {
  if (!row) return null;

  const {
    id,
    section_key,
    title,
    content,
    display_order,
    published,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    section_key,
    title,
    content,
    display_order,
    published,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
    },
    created_at,
    updated_at,
  };
};

const create = async (data) => {
  const {
    section_key,
    title = null,
    content = null,
    display_order = null,
    published = false,
    images = {},
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO homepage_sections
      (section_key, title, content, display_order, published,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    section_key,
    title,
    content,
    display_order,
    published,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
  ];

  const { rows } = await pool.query(query, values);
  return mapSection(rows[0]);
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

  if (data.section_key !== undefined) setField('section_key', data.section_key);
  if (data.title !== undefined) setField('title', data.title);
  if (data.content !== undefined) setField('content', data.content);
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
    UPDATE homepage_sections
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapSection(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM homepage_sections WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM homepage_sections
     ORDER BY display_order ASC NULLS LAST, created_at DESC`
  );
  return rows.map(mapSection);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM homepage_sections
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapSection(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
