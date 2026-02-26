const { pool } = require('../../config/db');
const { sanitizeBody, extractFirstImageSrc, DEFAULT_SHARE_IMAGE } = require('../aboutPageService');

const baseSelect = `
  id,
  entry_type,
  company_key,
  title,
  subtitle,
  body,
  published,
  display_order,
  seo_meta_title,
  seo_meta_description,
  seo_share_image,
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
  updated_at
`;

const mapAsafo = (row) => {
  const safeBody = sanitizeBody(row.body || '');
  const shareImage =
    row.seo_share_image || extractFirstImageSrc(safeBody) || row.medium_image_path || DEFAULT_SHARE_IMAGE;

  return {
    id: row.id,
    entry_type: row.entry_type,
    company_key: row.company_key,
    title: row.title || row.name,
    subtitle: row.subtitle,
    body: safeBody,
    published: row.published,
    display_order: row.display_order,
    seo_meta_title: row.seo_meta_title,
    seo_meta_description: row.seo_meta_description,
    seo_share_image: row.seo_share_image,
    share_image: shareImage,
    name: row.name,
    slug: row.slug,
    history: row.history,
    description: row.description,
    events: row.events,
    images: {
      original: row.original_image_path,
      large: row.large_image_path,
      medium: row.medium_image_path,
      thumbnail: row.thumbnail_image_path,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const findAllPublished = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM asafo_companies
     WHERE published = true
     ORDER BY display_order ASC, created_at ASC`
  );
  return rows.map(mapAsafo);
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM asafo_companies
     WHERE (slug = $1 OR company_key = $1) AND published = true
     ORDER BY created_at DESC
     LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapAsafo(rows[0]) : null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM asafo_companies
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapAsafo(rows[0]) : null;
};

module.exports = { findAllPublished, findBySlug, findById };
