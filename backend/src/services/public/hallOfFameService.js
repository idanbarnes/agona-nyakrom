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

const mapEntry = (row) => {
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

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM hall_of_fame
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapEntry(rows[0]);
};

module.exports = {
  findAllPublished,
  findBySlug,
};
