const { pool } = require('../config/db');

const ALLOWED_SLUGS = ['history', 'who-we-are', 'about-agona-nyakrom-town'];
const DEFAULT_SHARE_IMAGE = process.env.PUBLIC_SHARE_IMAGE_URL || '/share-default.svg';

const baseSelect = `
  id,
  slug,
  page_title,
  subtitle,
  body,
  published,
  seo_meta_title,
  seo_meta_description,
  seo_share_image,
  created_at,
  updated_at
`;

const sanitizeBody = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
};

const extractFirstImageSrc = (html = '') => {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const mapRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    body: sanitizeBody(row.body),
  };
};

const assertSlug = (slug) => {
  if (!ALLOWED_SLUGS.includes(slug)) {
    const err = new Error('Unsupported about page slug.');
    err.status = 400;
    throw err;
  }
};

const getBySlug = async (slug) => {
  assertSlug(slug);
  const { rows } = await pool.query(
    `SELECT ${baseSelect} FROM about_pages WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return mapRow(rows[0]);
};

const upsertBySlug = async (slug, data = {}) => {
  assertSlug(slug);

  const {
    page_title = '',
    subtitle = null,
    body = null,
    published = false,
    seo_meta_title = null,
    seo_meta_description = null,
    seo_share_image = null,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO about_pages
      (slug, page_title, subtitle, body, published, seo_meta_title, seo_meta_description, seo_share_image, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (slug)
     DO UPDATE SET
      page_title = COALESCE(EXCLUDED.page_title, about_pages.page_title),
      subtitle = EXCLUDED.subtitle,
      body = EXCLUDED.body,
      published = COALESCE(EXCLUDED.published, about_pages.published),
      seo_meta_title = EXCLUDED.seo_meta_title,
      seo_meta_description = EXCLUDED.seo_meta_description,
      seo_share_image = EXCLUDED.seo_share_image,
      updated_at = NOW()
     RETURNING ${baseSelect}`,
    [
      slug,
      page_title,
      subtitle,
      sanitizeBody(body),
      published,
      seo_meta_title,
      seo_meta_description,
      seo_share_image,
    ]
  );

  return mapRow(rows[0]);
};

const getPublishedBySlug = async (slug) => {
  assertSlug(slug);
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM about_pages
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );

  const page = mapRow(rows[0]);
  if (!page) return null;

  const shareImage =
    page.seo_share_image || extractFirstImageSrc(page.body) || DEFAULT_SHARE_IMAGE;

  return {
    slug: page.slug,
    page_title: page.page_title,
    subtitle: page.subtitle,
    body: page.body,
    meta_title: page.seo_meta_title || page.page_title,
    meta_description: page.seo_meta_description || null,
    share_image: shareImage,
  };
};

module.exports = {
  ALLOWED_SLUGS,
  getBySlug,
  upsertBySlug,
  getPublishedBySlug,
};
