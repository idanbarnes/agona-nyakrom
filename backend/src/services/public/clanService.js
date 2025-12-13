const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  slug,
  intro,
  history,
  key_contributions,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  published,
  created_at,
  updated_at
`;

const mapClan = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    intro,
    history,
    key_contributions,
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
    intro,
    history,
    key_contributions,
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

const findAllPublished = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM family_clans
     WHERE published = true
     ORDER BY name ASC`
  );
  return rows.map(mapClan);
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM family_clans
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );
  return mapClan(rows[0]);
};

module.exports = {
  findAllPublished,
  findBySlug,
};
