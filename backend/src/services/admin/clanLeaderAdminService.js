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

const getById = async (leaderId) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM clan_leaders
     WHERE id = $1
     LIMIT 1`,
    [leaderId]
  );
  return mapLeader(rows[0]);
};

const getNextDisplayOrder = async (clanId, type) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(display_order), 0) AS max_order
     FROM clan_leaders
     WHERE clan_id = $1 AND type = $2`,
    [clanId, type]
  );
  return Number(rows[0]?.max_order || 0) + 1;
};

const create = async (data) => {
  const {
    clan_id,
    type,
    name = null,
    title = null,
    position,
    display_order,
    images = {},
  } = data;

  const orderValue =
    display_order !== undefined && display_order !== null
      ? display_order
      : await getNextDisplayOrder(clan_id, type);

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO clan_leaders
      (clan_id, type, name, title, position, display_order,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    clan_id,
    type,
    name,
    title,
    position,
    orderValue,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
  ];

  const { rows } = await pool.query(query, values);
  return mapLeader(rows[0]);
};

const update = async (leaderId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (data.type !== undefined) setField('type', data.type);
  if (data.name !== undefined) setField('name', data.name);
  if (data.title !== undefined) setField('title', data.title);
  if (data.position !== undefined) setField('position', data.position);
  if (data.display_order !== undefined) setField('display_order', data.display_order);

  if (data.images) {
    const { original, large, medium, thumbnail } = data.images;
    if (original !== undefined) setField('original_image_path', original);
    if (large !== undefined) setField('large_image_path', large);
    if (medium !== undefined) setField('medium_image_path', medium);
    if (thumbnail !== undefined) setField('thumbnail_image_path', thumbnail);
  }

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(leaderId);

  const query = `
    UPDATE clan_leaders
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapLeader(rows[0]);
};

const remove = async (leaderId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM clan_leaders WHERE id = $1',
    [leaderId]
  );
  return rowCount > 0;
};

const reorder = async (clanId, orderedIdsByType) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [type, ids] of Object.entries(orderedIdsByType)) {
      if (!Array.isArray(ids)) {
        continue;
      }

      // Ensure leaders exist for this clan and match the requested type.
      const { rows } = await client.query(
        `SELECT id, type
         FROM clan_leaders
         WHERE clan_id = $1 AND id = ANY($2::uuid[])`,
        [clanId, ids]
      );

      if (rows.length !== ids.length) {
        throw new Error('Leader list does not match clan records.');
      }

      const invalidType = rows.some((row) => row.type !== type);
      if (invalidType) {
        throw new Error('Leader type mismatch for reorder.');
      }

      for (let index = 0; index < ids.length; index += 1) {
        await client.query(
          `UPDATE clan_leaders
           SET display_order = $1, updated_at = NOW()
           WHERE id = $2 AND clan_id = $3`,
          [index + 1, ids[index], clanId]
        );
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getByClan,
  getById,
  create,
  update,
  delete: remove,
  getNextDisplayOrder,
  reorder,
};
