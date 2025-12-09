const { pool } = require('../config/db');

const mapObituary = (row) => {
  if (!row) return null;
  const {
    id,
    name,
    slug,
    birth_date,
    death_date,
    age,
    funeral_start_at,
    funeral_end_at,
    location,
    description,
    map_link,
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
    birth_date,
    death_date,
    age,
    funeral_start_at,
    funeral_end_at,
    location,
    description,
    map_link,
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

const findAllObituaries = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM obituaries
     WHERE published = true
     ORDER BY death_date DESC NULLS LAST, created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapObituary);
};

const countAllObituaries = async () => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM obituaries WHERE published = true'
  );
  return rows[0]?.count || 0;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM obituaries
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapObituary(rows[0]);
};

module.exports = {
  findAllObituaries,
  countAllObituaries,
  findBySlug,
};
