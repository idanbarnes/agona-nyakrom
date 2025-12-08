const { pool } = require('../config/db');

const TABLE = 'homepage_settings';

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

const create = async (data) => {
  const {
    hero_title = null,
    hero_subtitle = null,
    hero_cta_text = null,
    hero_cta_url = null,
    featured_news_ids = null,
    featured_hall_of_fame_ids = null,
    featured_landmark_ids = null,
    published = false,
    original_image_path = null,
    large_image_path = null,
    medium_image_path = null,
    thumbnail_image_path = null,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO ${TABLE} 
     (hero_title, hero_subtitle, hero_cta_text, hero_cta_url, featured_news_ids, featured_hall_of_fame_ids, featured_landmark_ids, published, original_image_path, large_image_path, medium_image_path, thumbnail_image_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      hero_title,
      hero_subtitle,
      hero_cta_text,
      hero_cta_url,
      featured_news_ids,
      featured_hall_of_fame_ids,
      featured_landmark_ids,
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
  findAll: withPagination,
};
