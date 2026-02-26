const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  slug,
  title,
  body,
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

const mapEntry = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    title,
    body,
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

  const normalizedBody = body || bio || achievements || '';
  const imageUrl =
    medium_image_path || large_image_path || original_image_path || thumbnail_image_path || '';

  return {
    id,
    name,
    slug,
    title,
    position: title || null,
    body: normalizedBody,
    bio: bio || normalizedBody,
    achievements,
    imageUrl,
    isPublished: Boolean(published),
    is_featured,
    display_order,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
    },
    createdAt: created_at,
    updatedAt: updated_at,
    created_at,
    updated_at,
  };
};

const findAllPublished = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     WHERE published = true
     ORDER BY is_featured DESC, display_order ASC NULLS LAST, created_at DESC`
  );
  return rows.map(mapEntry);
};

const findBySlugOrId = async (slugOrId) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     WHERE published = true
       AND (slug = $1 OR id::text = $1)
     LIMIT 1`,
    [slugOrId]
  );
  return mapEntry(rows[0]);
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapEntry(rows[0]);
};

module.exports = {
  findAllPublished,
  findBySlugOrId,
  findById,
};
