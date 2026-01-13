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
    created_at,
    updated_at,
  };
};

const getPublished = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM history_page
     WHERE published = true
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 1`
  );
  return mapHistory(rows[0]);
};

module.exports = {
  getPublished,
};
