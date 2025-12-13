const { pool } = require('../../config/db');

const baseSelect = `
  id,
  name,
  slug,
  age,
  birth_date,
  death_date,
  funeral_start_at,
  funeral_end_at,
  location,
  description,
  map_link,
  COALESCE(description, NULL) AS summary_field,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  created_at,
  updated_at
`;

const mapObituary = (row) => {
  if (!row) return null;

  const {
    id,
    name,
    slug,
    age,
    birth_date,
    death_date,
    funeral_start_at,
    funeral_end_at,
    description,
    summary_field,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    full_name: name,
    slug,
    age,
    summary: summary_field || description || null,
    biography: description || summary_field || null,
    date_of_birth: birth_date,
    date_of_death: death_date,
    burial_date: funeral_end_at,
    funeral_date: funeral_start_at,
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

const create = async (data) => {
  const {
    full_name,
    slug,
    age = null,
    summary = null,
    biography = null,
    date_of_birth = null,
    date_of_death = null,
    burial_date = null,
    funeral_date = null,
    images = {},
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO obituaries
      (name, slug, age, birth_date, death_date, funeral_start_at, funeral_end_at,
       description, original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    full_name,
    slug,
    age,
    date_of_birth,
    date_of_death,
    funeral_date,
    burial_date,
    biography || summary,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
  ];

  const { rows } = await pool.query(query, values);
  return mapObituary(rows[0]);
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

  if (data.full_name !== undefined) setField('name', data.full_name);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.age !== undefined) setField('age', data.age);
  if (data.summary !== undefined || data.biography !== undefined) {
    setField('description', data.biography ?? data.summary);
  }
  if (data.date_of_birth !== undefined) setField('birth_date', data.date_of_birth);
  if (data.date_of_death !== undefined) setField('death_date', data.date_of_death);
  if (data.funeral_date !== undefined) setField('funeral_start_at', data.funeral_date);
  if (data.burial_date !== undefined) setField('funeral_end_at', data.burial_date);

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
    UPDATE obituaries
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapObituary(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM obituaries WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM obituaries
     ORDER BY created_at DESC`
  );
  return rows.map(mapObituary);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM obituaries
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapObituary(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
