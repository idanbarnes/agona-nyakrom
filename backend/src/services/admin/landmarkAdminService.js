const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  title,
  slug,
  category,
  description,
  address,
  latitude,
  longitude,
  video_url,
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
    title,
    slug,
    category,
    description,
    address,
    latitude,
    longitude,
    video_url,
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
    title,
    slug,
    category,
    description,
    address,
    latitude,
    longitude,
    video_url,
    location: address,
    google_map_link: video_url,
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
    category = null,
    description = null,
    address = null,
    latitude = null,
    longitude = null,
    video_url = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO landmarks
      (name, title, slug, category, description, address, latitude, longitude, video_url,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    name,
    title,
    slug,
    category,
    description,
    address,
    latitude,
    longitude,
    video_url,
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
  if (data.title !== undefined) setField('title', data.title);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.category !== undefined) setField('category', data.category);
  if (data.description !== undefined) setField('description', data.description);
  if (data.address !== undefined) setField('address', data.address);
  if (data.latitude !== undefined) setField('latitude', data.latitude);
  if (data.longitude !== undefined) setField('longitude', data.longitude);
  if (data.video_url !== undefined) setField('video_url', data.video_url);
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
