const { pool } = require('../config/db');

const TABLE = 'obituaries';

const withPagination = async (limit = 10, offset = 0) => {
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE slug = $1`, [slug]);
  return rows[0] || null;
};

const create = async (data) => {
  const {
    name,
    slug,
    birth_date = null,
    death_date = null,
    age = null,
    funeral_start_at = null,
    funeral_end_at = null,
    location = null,
    description = null,
    map_link = null,
    published = false,
    original_image_path = null,
    large_image_path = null,
    medium_image_path = null,
    thumbnail_image_path = null,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO ${TABLE} 
     (name, slug, birth_date, death_date, age, funeral_start_at, funeral_end_at, location, description, map_link, published, original_image_path, large_image_path, medium_image_path, thumbnail_image_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      name,
      slug,
      birth_date,
      death_date,
      age,
      funeral_start_at,
      funeral_end_at,
      location,
      description,
      map_link,
      published,
      original_image_path,
      large_image_path,
      medium_image_path,
      thumbnail_image_path,
    ]
  );
  return rows[0];
};

const update = async (id, updates) => {
  const fields = Object.keys(updates || {});
  if (!fields.length) throw new Error('No fields provided to update.');

  const setClauses = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  const values = fields.map((field) => updates[field]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE ${TABLE} SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
  return true;
};

module.exports = {
  create,
  update,
  delete: remove,
  findById,
  findBySlug,
  findAll: withPagination,
};
