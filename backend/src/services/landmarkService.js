const { pool } = require('../config/db');

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
    created_at,
    updated_at,
  };
};

const findAll = async ({ limit, offset, category }) => {
  const params = [limit, offset];
  let whereClause = 'WHERE published = true';

  if (category) {
    params.unshift(category);
    whereClause = `${whereClause} AND category = $1`;
    // shift limit/offset positions after category
    params.push(params.splice(1, 1)[0]); // move limit to end
    params.push(params.splice(1, 1)[0]); // move offset to end
  }

  const query = `
    SELECT *
    FROM landmarks
    ${whereClause}
    ORDER BY name ASC, created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(query, params);
  return rows.map(mapLandmark);
};

const countAll = async ({ category }) => {
  if (category) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM landmarks WHERE published = true AND category = $1',
      [category]
    );
    return rows[0]?.count || 0;
  }
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
