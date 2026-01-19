const { pool } = require('../../config/db');

const mapSlide = (row) => {
  if (!row) return null;

  const {
    id,
    title,
    subtitle,
    caption,
    cta_text,
    cta_url,
    published,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    crop_x,
    crop_y,
    crop_w,
    crop_h,
    display_order,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    title,
    subtitle,
    caption,
    cta_text,
    cta_url,
    published,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
      desktop: large_image_path,
      tablet: medium_image_path,
      mobile: thumbnail_image_path,
    },
    crop:
      crop_x !== null &&
      crop_y !== null &&
      crop_w !== null &&
      crop_h !== null
        ? {
            x: Number(crop_x),
            y: Number(crop_y),
            w: Number(crop_w),
            h: Number(crop_h),
          }
        : null,
    display_order,
    created_at,
    updated_at,
  };
};

const findPublished = async () => {
  const { rows } = await pool.query(
    `SELECT *
     FROM carousel_slides
     WHERE published = true
     ORDER BY display_order ASC, created_at DESC`
  );
  return rows.map(mapSlide);
};

module.exports = {
  findPublished,
};
