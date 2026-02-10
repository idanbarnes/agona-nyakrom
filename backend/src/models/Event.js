const { pool } = require('../config/db');

const baseSelect = `
  id,
  title,
  slug,
  excerpt,
  body,
  event_tag,
  event_date,
  flyer_image_path,
  flyer_alt_text,
  is_published,
  created_at,
  updated_at
`;

const stateSelect = `
  CASE
    WHEN event_date IS NULL THEN 'COMING_SOON'
    WHEN event_date >= CURRENT_DATE THEN 'UPCOMING'
    ELSE 'PAST'
  END AS state
`;

const create = async (data) => {
  const {
    title,
    slug,
    excerpt = null,
    body = null,
    event_tag = null,
    event_date = null,
    flyer_image_path = null,
    flyer_alt_text = null,
    is_published = false,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO events
      (title, slug, excerpt, body, event_tag, event_date, flyer_image_path, flyer_alt_text, is_published, created_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING ${baseSelect}`,
    [
      title,
      slug,
      excerpt,
      body,
      event_tag,
      event_date,
      flyer_image_path,
      flyer_alt_text,
      is_published,
    ]
  );

  return rows[0] || null;
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

  if (data.title !== undefined) setField('title', data.title);
  if (data.slug !== undefined) setField('slug', data.slug);
  if (data.excerpt !== undefined) setField('excerpt', data.excerpt);
  if (data.body !== undefined) setField('body', data.body);
  if (data.event_tag !== undefined) setField('event_tag', data.event_tag);
  if (data.event_date !== undefined) setField('event_date', data.event_date);
  if (data.flyer_image_path !== undefined) setField('flyer_image_path', data.flyer_image_path);
  if (data.flyer_alt_text !== undefined) setField('flyer_alt_text', data.flyer_alt_text);
  if (data.is_published !== undefined) setField('is_published', data.is_published);

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(id);

  const { rows } = await pool.query(
    `UPDATE events
     SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING ${baseSelect}`,
    values
  );

  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [id]);
  return rowCount > 0;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM events
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM events
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const findPublishedBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM events
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const buildWhere = ({ search, isPublished, state, dateFrom, dateTo, tag } = {}) => {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(title ILIKE $${values.length} OR excerpt ILIKE $${values.length})`);
  }

  if (isPublished !== undefined) {
    values.push(isPublished);
    conditions.push(`is_published = $${values.length}`);
  }

  if (state === 'coming_soon') {
    conditions.push('event_date IS NULL');
  } else if (state === 'upcoming') {
    conditions.push('event_date >= CURRENT_DATE');
  } else if (state === 'past') {
    conditions.push('event_date < CURRENT_DATE');
  }

  if (dateFrom) {
    values.push(dateFrom);
    conditions.push(`event_date >= $${values.length}`);
  }

  if (dateTo) {
    values.push(dateTo);
    conditions.push(`event_date <= $${values.length}`);
  }

  if (tag) {
    values.push(`%${tag}%`);
    conditions.push(`event_tag ILIKE $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values };
};

const findAdminList = async ({
  search,
  isPublished,
  state,
  dateFrom,
  dateTo,
  tag,
  limit,
  offset,
} = {}) => {
  const { whereClause, values } = buildWhere({
    search,
    isPublished,
    state,
    dateFrom,
    dateTo,
    tag,
  });

  const listValues = values.slice();
  listValues.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT ${baseSelect}, ${stateSelect}
     FROM events
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM events
     ${whereClause}`,
    values
  );

  return {
    items: rows,
    total: countRows[0]?.count || 0,
  };
};

const findPublicList = async ({ state, tag, limit, offset } = {}) => {
  const baseConditions = ['is_published = true'];
  const values = [];

  if (state === 'coming_soon') {
    baseConditions.push('event_date IS NULL');
  } else if (state === 'upcoming') {
    baseConditions.push('event_date >= CURRENT_DATE');
  } else if (state === 'past') {
    baseConditions.push('event_date < CURRENT_DATE');
  }

  if (tag) {
    values.push(`%${tag}%`);
    baseConditions.push(`event_tag ILIKE $${values.length}`);
  }

  const whereClause = baseConditions.length ? `WHERE ${baseConditions.join(' AND ')}` : '';

  const listValues = values.slice();
  listValues.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT ${baseSelect}, ${stateSelect}
     FROM events
     ${whereClause}
     ORDER BY
       CASE
         WHEN event_date IS NULL THEN 0
         WHEN event_date >= CURRENT_DATE THEN 1
         ELSE 2
       END ASC,
       CASE
         WHEN event_date IS NULL THEN created_at
       END DESC,
       CASE
         WHEN event_date >= CURRENT_DATE THEN event_date
       END ASC,
       CASE
         WHEN event_date < CURRENT_DATE THEN event_date
       END DESC,
       created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM events
     ${whereClause}`
  );

  return {
    items: rows,
    total: countRows[0]?.count || 0,
  };
};

module.exports = {
  create,
  update,
  delete: remove,
  findById,
  findBySlug,
  findPublishedBySlug,
  findAdminList,
  findPublicList,
};
