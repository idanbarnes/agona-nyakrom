const { pool } = require('../config/db');

// Public fields only; avoid exposing internal flags if not needed
const mapNews = (row) => {
  if (!row) return null;
  const {
    id,
    title,
    slug,
    excerpt,
    content,
    reporter,
    published_at,
    tags,
    categories,
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
    slug,
    excerpt,
    content,
    reporter,
    published_at,
    tags,
    categories,
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

const findAllNews = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM news
     WHERE published = true
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapNews);
};

const countAllNews = async () => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM news WHERE published = true'
  );
  return rows[0]?.count || 0;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM news
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapNews(rows[0]);
};

module.exports = {
  findAllNews,
  countAllNews,
  findBySlug,
};
