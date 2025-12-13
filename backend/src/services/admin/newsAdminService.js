const { pool } = require('../../config/db');

const baseSelect = `
  id, title, slug, excerpt, content, reporter, published_at, status, tags, categories,
  original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
  published, created_at, updated_at
`;

const mapNews = (row) => {
  if (!row) return null;
  const {
    id,
    title,
    slug,
    excerpt,
    content,
    reporter,
    published_at,
    status,
    tags,
    categories,
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
    title,
    slug,
    summary: excerpt,
    content,
    reporter,
    published_at,
    status,
    tags,
    categories,
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
    title,
    slug,
    summary,
    content,
    reporter = null,
    published_at = null,
    status = 'draft',
    tags = null,
    categories = null,
    images = {},
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;

  const query = `
    INSERT INTO news
      (title, slug, excerpt, content, reporter, published_at, status, tags, categories,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path, published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    title,
    slug,
    summary,
    content,
    reporter,
    published_at,
    status,
    tags,
    categories,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapNews(rows[0]);
};

const update = async (id, data) => {
  // Build dynamic update
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
  if (data.summary !== undefined) setField('excerpt', data.summary);
  if (data.content !== undefined) setField('content', data.content);
  if (data.reporter !== undefined) setField('reporter', data.reporter);
  if (data.published_at !== undefined) setField('published_at', data.published_at);
  if (data.status !== undefined) setField('status', data.status);
  if (data.tags !== undefined) setField('tags', data.tags);
  if (data.categories !== undefined) setField('categories', data.categories);
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

  // updated_at
  setField('updated_at', new Date());

  values.push(id);

  const query = `
    UPDATE news
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapNews(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM news WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM news
     ORDER BY created_at DESC`
  );
  return rows.map(mapNews);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM news
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapNews(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
