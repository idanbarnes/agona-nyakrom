const { pool } = require('../../config/db');

const baseSelect = `
  id,
  title,
  subtitle,
  content,
  highlights,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  published,
  created_at,
  updated_at
`;

const normalizeJsonInput = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const mapHistory = (row) => {
  if (!row) return null;

  const {
    id,
    title,
    subtitle,
    content,
    highlights,
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
    title,
    subtitle,
    content,
    highlights,
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

const getCurrent = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM history_page
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 1`
  );
  return mapHistory(rows[0]);
};

const create = async (data) => {
  const {
    title,
    subtitle = null,
    content,
    highlights = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO history_page
      (title, subtitle, content, highlights,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    title,
    subtitle,
    content,
    normalizeJsonInput(highlights),
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapHistory(rows[0]);
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
  if (data.subtitle !== undefined) setField('subtitle', data.subtitle);
  if (data.content !== undefined) setField('content', data.content);
  if (data.highlights !== undefined) {
    setField('highlights', normalizeJsonInput(data.highlights));
  }
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
    UPDATE history_page
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapHistory(rows[0]);
};

module.exports = {
  getCurrent,
  create,
  update,
};
