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
    published,
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
    published,
    created_at,
    updated_at,
  };
};

const create = async (data) => {
  const {
    name,
    slug,
    intro = null,
    history = null,
    key_contributions = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO family_clans
      (name, slug, intro, history, key_contributions,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    name,
    slug,
    intro,
    history,
    key_contributions,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapClan(rows[0]);
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (data.name !== undefined) setField('name', data.name);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.intro !== undefined) setField('intro', data.intro);
  if (data.history !== undefined) setField('history', data.history);
  if (data.key_contributions !== undefined) setField('key_contributions', data.key_contributions);
  if (data.published !== undefined) setField('published', data.published);

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

  values.push(id);

  const query = `
    UPDATE family_clans
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapClan(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM family_clans WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM family_clans
     ORDER BY created_at DESC`
  );
  return rows.map(mapClan);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM family_clans
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapClan(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
