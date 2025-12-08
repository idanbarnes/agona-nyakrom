const { pool } = require('../config/db');

const TABLE = 'contact_submissions';

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
    name,
    email,
    phone = null,
    purpose = null,
    message,
    status = 'pending',
    handled_at = null,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO ${TABLE} 
     (name, email, phone, purpose, message, status, handled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, email, phone, purpose, message, status, handled_at]
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
