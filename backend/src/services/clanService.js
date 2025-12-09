const { pool } = require('../config/db');

const mapLeader = (row) => {
  if (!row) return null;
  const {
    id,
    name,
    title,
    bio,
    tenure_start,
    tenure_end,
    is_current,
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
    bio,
    tenure_start,
    tenure_end,
    is_current,
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
    logo_images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
    },
    created_at,
    updated_at,
  };
};

const findAllClans = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM family_clans
     WHERE published = true
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapClan);
};

const countAllClans = async () => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM family_clans WHERE published = true'
  );
  return rows[0]?.count || 0;
};

const findBySlugWithLeaders = async (slug) => {
  // Get clan
  const clanResult = await pool.query(
    `SELECT *
     FROM family_clans
     WHERE slug = $1 AND published = true
     LIMIT 1`,
    [slug]
  );

  const clan = mapClan(clanResult.rows[0]);
  if (!clan) return null;

  // Current leaders
  const currentLeadersResult = await pool.query(
    `SELECT *
     FROM clan_leaders
     WHERE family_clan_id = $1 AND is_current = true
     ORDER BY created_at DESC`,
    [clan.id]
  );

  // Past leaders
  const pastLeadersResult = await pool.query(
    `SELECT *
     FROM past_leaders
     WHERE family_clan_id = $1
     ORDER BY created_at DESC`,
    [clan.id]
  );

  return {
    ...clan,
    current_leaders: currentLeadersResult.rows.map(mapLeader),
    past_leaders: pastLeadersResult.rows.map(mapLeader),
  };
};

module.exports = {
  findAllClans,
  countAllClans,
  findBySlugWithLeaders,
};
