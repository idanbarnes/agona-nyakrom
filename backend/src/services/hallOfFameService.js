const { pool } = require('../config/db');

const mapHero = (row) => {
  if (!row) return null;
  const {
    id,
    name,
    slug,
    title,
    body,
    bio,
    achievements,
    is_featured,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    published,
    created_at,
    updated_at,
  } = row;

  const normalizedBody = body || bio || achievements || '';
  const imageUrl =
    medium_image_path || large_image_path || original_image_path || thumbnail_image_path || '';

  return {
    id,
    name,
    slug,
    title,
    position: title || null,
    body: normalizedBody,
    bio: bio || normalizedBody,
    short_bio: bio || normalizedBody,
    achievements,
    imageUrl,
    isPublished: Boolean(published),
    is_featured,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
    },
    createdAt: created_at,
    updatedAt: updated_at,
    created_at,
    updated_at,
  };
};

const findAll = async ({ limit, offset, featured }) => {
  const params = [];
  let index = 1;
  const where = ['published = true'];

  if (featured) {
    where.push('is_featured = true');
  }

  params.push(limit);
  const limitIndex = index++;
  params.push(offset);
  const offsetIndex = index++;

  const { rows } = await pool.query(
    `SELECT *
     FROM hall_of_fame
     WHERE ${where.join(' AND ')}
     ORDER BY is_featured DESC, display_order ASC NULLS LAST, created_at DESC
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    params
  );

  return rows.map(mapHero);
};

const countAll = async ({ featured }) => {
  const params = [];
  const where = ['published = true'];

  if (featured) {
    where.push('is_featured = true');
  }

  const query = `SELECT COUNT(*)::int AS count FROM hall_of_fame WHERE ${where.join(' AND ')}`;
  const { rows } = await pool.query(query, params);
  return rows[0]?.count || 0;
};

const findBySlugOrId = async (slugOrId) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM hall_of_fame
     WHERE published = true
       AND (slug = $1 OR id::text = $1)
     LIMIT 1`,
    [slugOrId]
  );
  return mapHero(rows[0]);
};

module.exports = {
  findAll,
  countAll,
  findBySlugOrId,
};
