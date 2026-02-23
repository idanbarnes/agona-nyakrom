const { pool } = require('../../config/db');
const { resolveAge } = require('../../utils/age');

const baseSelect = `
  id,
  name,
  slug,
  birth_date,
  death_date,
  age,
  funeral_start_at,
  funeral_end_at,
  visitation_start_at,
  visitation_location,
  funeral_location,
  burial_location,
  deceased_photo_url,
  poster_image_url,
  location,
  description,
  map_link,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  created_at,
  updated_at
`;

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
    visitation_start_at,
    visitation_location,
    funeral_location,
    burial_location,
    deceased_photo_url,
    poster_image_url,
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
  const normalizedAge = resolveAge(age, birth_date, death_date);

  return {
    id,
    full_name: name,
    name,
    slug,
    date_of_birth: birth_date,
    date_of_death: death_date,
    age: normalizedAge,
    funeral_date: funeral_start_at,
    burial_date: funeral_end_at,
    visitation_date: visitation_start_at,
    visitation_location: visitation_location || null,
    funeral_location: funeral_location || null,
    burial_location: burial_location || null,
    deceased_photo_url: deceased_photo_url || null,
    poster_image_url: poster_image_url || null,
    location,
    summary: description || null,
    biography: description || null,
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

const normalizePagination = ({ page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
};

const findPublished = async ({ page = 1, limit = 10 } = {}) => {
  const { page: currentPage, limit: pageLimit, offset } = normalizePagination({ page, limit });

  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM obituaries
     WHERE published = true
     ORDER BY death_date DESC NULLS LAST, created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageLimit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM obituaries WHERE published = true'
  );

  return {
    items: rows.map(mapObituary),
    total: countRows[0]?.count || 0,
    page: currentPage,
    limit: pageLimit,
  };
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM obituaries
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapObituary(rows[0]);
};

module.exports = {
  findPublished,
  findBySlug,
};
