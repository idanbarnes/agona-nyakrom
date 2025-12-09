const { pool } = require('../config/db');

const mapCompany = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    history,
    description,
    events,
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
    history,
    description,
    events,
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

const findAll = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM asafo_companies
     WHERE published = true
     ORDER BY name ASC, created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapCompany);
};

const countAll = async () => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM asafo_companies WHERE published = true'
  );
  return rows[0]?.count || 0;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM asafo_companies
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapCompany(rows[0]);
};

module.exports = {
  findAll,
  countAll,
  findBySlug,
};
