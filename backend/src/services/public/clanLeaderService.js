const { pool } = require('../../config/db');

const baseSelect = `
  id,
  clan_id,
  type,
  name,
  title,
  position,
  display_order,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  created_at,
  updated_at
`;

const mapLeader = (row) => {
  if (!row) return null;

  const {
    id,
    clan_id,
    type,
    name,
    title,
    position,
    display_order,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    clan_id,
    type,
    name,
    title,
    position,
    display_order,
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

const getByClan = async (clanId) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM clan_leaders
     WHERE clan_id = $1
     ORDER BY type ASC, display_order ASC, created_at ASC`,
    [clanId]
  );
  return rows.map(mapLeader);
};

module.exports = {
  getByClan,
};
