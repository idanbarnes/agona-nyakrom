const { pool } = require('../../config/db');

const baseSelect = `
  id,
  site_name,
  tagline,
  contact_email,
  contact_phone,
  address,
  social_links,
  navigation_links,
  footer_text,
  published,
  created_at,
  updated_at
`;

const mapSettings = (row) => {
  if (!row) return null;
  const {
    id,
    site_name,
    tagline,
    contact_email,
    contact_phone,
    address,
    social_links,
    navigation_links,
    footer_text,
    published,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    site_name,
    tagline,
    contact_email,
    contact_phone,
    address,
    social_links,
    navigation_links,
    footer_text,
    published,
    created_at,
    updated_at,
  };
};

const getPublished = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM global_settings
     WHERE published = true
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 1`
  );
  return mapSettings(rows[0]);
};

module.exports = {
  getPublished,
};
