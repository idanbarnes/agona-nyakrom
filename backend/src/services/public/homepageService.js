const { pool } = require('../../config/db');

const mapImages = (row) => ({
  original: row?.original_image_path || null,
  large: row?.large_image_path || null,
  medium: row?.medium_image_path || null,
  thumbnail: row?.thumbnail_image_path || null,
});

const mapSection = (row) => {
  if (!row) return null;
  const {
    id,
    section_key,
    title,
    content,
    display_order,
    is_featured,
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
    is_featured,
    images: mapImages({
      original_image_path,
      large_image_path,
      medium_image_path,
      thumbnail_image_path,
    }),
    created_at,
    updated_at,
  };
};

const getPublishedSections = async () => {
  const { rows } = await pool.query(
    `SELECT
       id,
       section_key,
       title,
       content,
       is_featured,
       display_order,
       original_image_path,
       large_image_path,
       medium_image_path,
       thumbnail_image_path,
       created_at,
       updated_at
     FROM homepage_sections
     WHERE published = true
     ORDER BY display_order ASC NULLS LAST, created_at DESC`
  );

  return rows.map(mapSection);
};

const getHomepage = async () => {
  const sections = await getPublishedSections();
  return {
    sections,
  };
};

module.exports = {
  getHomepage,
};
