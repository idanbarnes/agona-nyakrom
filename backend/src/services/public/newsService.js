const { pool } = require('../../config/db');

const baseSelect = `
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
  updated_at
`;

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
    summary: excerpt,
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
     FROM news
     WHERE published = true
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageLimit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM news WHERE published = true'
  );

  return {
    items: rows.map(mapNews),
    total: countRows[0]?.count || 0,
    page: currentPage,
    limit: pageLimit,
  };
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM news
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapNews(rows[0]);
};

module.exports = {
  findPublished,
  findBySlug,
};
