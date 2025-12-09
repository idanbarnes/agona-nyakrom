const { pool } = require('../config/db');

const mapHero = (row) => {
  if (!row) return null;
  const {
    id,
    name,
    slug,
    title,
    bio,
    achievements,
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
    name,
    slug,
    title,
    short_bio: bio,
    achievements,
    is_featured,
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

const findAll = async ({ limit, offset, featured }) => {
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (featured) {
    whereClause += ' AND is_featured = true';
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT *
     FROM hall_of_fame
     ${whereClause}
     ORDER BY created_at DESC, name ASC
     LIMIT $1 OFFSET $2`,
    params
  );

  return rows.map(mapHero);
};

const countAll = async ({ featured }) => {
  let query = 'SELECT COUNT(*)::int AS count FROM hall_of_fame';
  const params = [];
  if (featured) {
    query += ' WHERE is_featured = true';
  }
  const { rows } = await pool.query(query, params);
  return rows[0]?.count || 0;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM hall_of_fame
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return mapHero(rows[0]);
};

module.exports = {
  findAll,
  countAll,
  findBySlug,
};
