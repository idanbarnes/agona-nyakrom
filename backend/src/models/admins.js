const { pool } = require('../config/db');

const TABLE = 'admins';
const PUBLIC_COLUMNS = 'id, email, name, role, active, last_login_at, created_at, updated_at';

const withPagination = async (limit = 10, offset = 0) => {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM ${TABLE} WHERE id = $1`, [id]);
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT id, email, name, role, active, last_login_at, created_at, updated_at
     FROM ${TABLE}
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const countAll = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${TABLE}`);
  return rows[0]?.count || 0;
};

const countActiveByRole = async (role) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM ${TABLE}
     WHERE role = $1 AND active = true`,
    [role]
  );
  return rows[0]?.count || 0;
};

const create = async (data) => {
  const {
    email,
    password_hash,
    role = 'admin',
    active = true,
    last_login_at = null,
    name = null,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE} (email, password_hash, role, active, last_login_at, name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, password_hash, role, active, last_login_at, name]
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
    `UPDATE ${TABLE}
     SET ${setClauses}, updated_at = NOW()
     WHERE id = $${fields.length + 1}
     RETURNING ${PUBLIC_COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
  return true;
};

module.exports = {
  countAll,
  countActiveByRole,
  create,
  update,
  delete: remove,
  findByEmail,
  findById,
  findAll: withPagination,
};
