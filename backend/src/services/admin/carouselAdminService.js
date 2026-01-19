const { pool } = require('../../config/db');

const baseSelect = `
  id,
  title,
  subtitle,
  caption,
  cta_text,
  cta_url,
  original_image_path,
  large_image_path,
  medium_image_path,
  thumbnail_image_path,
  crop_x,
  crop_y,
  crop_w,
  crop_h,
  display_order,
  published,
  created_at,
  updated_at
`;

const mapSlide = (row) => {
  if (!row) return null;

  const {
    id,
    title,
    subtitle,
    caption,
    cta_text,
    cta_url,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    crop_x,
    crop_y,
    crop_w,
    crop_h,
    display_order,
    published,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    title,
    subtitle,
    caption,
    cta_text,
    cta_url,
    images: {
      original: original_image_path,
      large: large_image_path,
      medium: medium_image_path,
      thumbnail: thumbnail_image_path,
      desktop: large_image_path,
      tablet: medium_image_path,
      mobile: thumbnail_image_path,
    },
    crop:
      crop_x !== null &&
      crop_y !== null &&
      crop_w !== null &&
      crop_h !== null
        ? {
            x: Number(crop_x),
            y: Number(crop_y),
            w: Number(crop_w),
            h: Number(crop_h),
          }
        : null,
    display_order,
    published,
    created_at,
    updated_at,
  };
};

const create = async (data) => {
  const {
    title = null,
    subtitle = null,
    caption = null,
    cta_text = null,
    cta_url = null,
    images = {},
    crop = null,
    display_order = 0,
    published = false,
  } = data;

  const { original, large, medium, thumbnail } = images;
  const cropX = crop?.x ?? null;
  const cropY = crop?.y ?? null;
  const cropW = crop?.w ?? null;
  const cropH = crop?.h ?? null;

  const query = `
    INSERT INTO carousel_slides
      (title, subtitle, caption, cta_text, cta_url,
       original_image_path, large_image_path, medium_image_path, thumbnail_image_path,
       crop_x, crop_y, crop_w, crop_h,
       display_order, published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    title,
    subtitle,
    caption,
    cta_text,
    cta_url,
    original || null,
    large || null,
    medium || null,
    thumbnail || null,
    cropX,
    cropY,
    cropW,
    cropH,
    display_order,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapSlide(rows[0]);
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
  if (data.subtitle !== undefined) setField('subtitle', data.subtitle);
  if (data.caption !== undefined) setField('caption', data.caption);
  if (data.cta_text !== undefined) setField('cta_text', data.cta_text);
  if (data.cta_url !== undefined) setField('cta_url', data.cta_url);
  if (data.display_order !== undefined) setField('display_order', data.display_order);
  if (data.published !== undefined) setField('published', data.published);

  if (data.images) {
    const { original, large, medium, thumbnail } = data.images;
    if (original !== undefined) setField('original_image_path', original);
    if (large !== undefined) setField('large_image_path', large);
    if (medium !== undefined) setField('medium_image_path', medium);
    if (thumbnail !== undefined) setField('thumbnail_image_path', thumbnail);
  }

  if (data.crop) {
    const { x, y, w, h } = data.crop;
    if (x !== undefined) setField('crop_x', x);
    if (y !== undefined) setField('crop_y', y);
    if (w !== undefined) setField('crop_w', w);
    if (h !== undefined) setField('crop_h', h);
  }

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(id);

  const query = `
    UPDATE carousel_slides
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapSlide(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM carousel_slides WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM carousel_slides
     ORDER BY display_order ASC, created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapSlide);
};

const countAll = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM carousel_slides');
  return rows[0]?.count || 0;
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM carousel_slides
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapSlide(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  countAll,
  getById,
};
