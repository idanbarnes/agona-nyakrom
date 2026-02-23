const { pool } = require('../../config/db');

const mapLandmark = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    description,
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
    description,
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
  const query = `
    SELECT *
    FROM landmarks
    WHERE published = true
    ORDER BY name ASC, created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const { rows } = await pool.query(query, [limit, offset]);
  return rows.map(mapLandmark);
};

const countAll = async () => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM landmarks WHERE published = true'
  );
  return rows[0]?.count || 0;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM landmarks
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapLandmark(rows[0]);
};

module.exports = {
  findAll,
  countAll,
  findBySlug,
};
