const { pool } = require('../../config/db');
const clanLeaderService = require('./clanLeaderService');

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
  const clan = mapClan(rows[0]);
  if (!clan) return null;

  const leaders = await clanLeaderService.getByClan(clan.id);
  const grouped = { current: [], past: [] };
  leaders.forEach((leader) => {
    if (leader?.type === 'past') {
      grouped.past.push(leader);
    } else {
      grouped.current.push(leader);
    }
  });

  return {
    ...clan,
    leaders: grouped,
  };
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM family_clans
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  const clan = mapClan(rows[0]);
  if (!clan) return null;

  const leaders = await clanLeaderService.getByClan(clan.id);
  const grouped = { current: [], past: [] };
  leaders.forEach((leader) => {
    if (leader?.type === 'past') {
      grouped.past.push(leader);
    } else {
      grouped.current.push(leader);
    }
  });

  return {
    ...clan,
    leaders: grouped,
  };
};

module.exports = {
  findAllPublished,
  findBySlug,
  findById,
};
