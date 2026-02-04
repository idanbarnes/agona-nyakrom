const { pool } = require('../../config/db');

const baseSelect = `
  id,
  title,
  block_type,
  display_order,
  is_published,
  published_at,
  subtitle,
  body,
  cta_label,
  cta_href,
  theme_variant,
  container_width,
  media_image_id,
  media_alt_text,
  layout_variant,
  hof_selection_mode,
  hof_items_count,
  hof_manual_item_ids,
  hof_filter_tag,
  hof_show_cta,
  hof_cta_label,
  hof_cta_href,
  news_source,
  news_feature_mode,
  news_featured_item_id,
  news_list_count,
  news_show_dates,
  news_cta_label,
  news_cta_href,
  quote_text,
  quote_author,
  background_style,
  background_image_id,
  background_overlay_strength,
  gateway_items,
  gateway_columns_desktop,
  gateway_columns_tablet,
  gateway_columns_mobile,
  created_at,
  updated_at
`;

const mapBlock = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    block_type: row.block_type,
    display_order: row.display_order,
    is_published: row.is_published,
    published_at: row.published_at,
    subtitle: row.subtitle,
    body: row.body,
    cta_label: row.cta_label,
    cta_href: row.cta_href,
    theme_variant: row.theme_variant,
    container_width: row.container_width,
    media_image_id: row.media_image_id,
    media_alt_text: row.media_alt_text,
    layout_variant: row.layout_variant,
    hof_selection_mode: row.hof_selection_mode,
    hof_items_count: row.hof_items_count,
    hof_manual_item_ids: row.hof_manual_item_ids || [],
    hof_filter_tag: row.hof_filter_tag,
    hof_show_cta: row.hof_show_cta,
    hof_cta_label: row.hof_cta_label,
    hof_cta_href: row.hof_cta_href,
    news_source: row.news_source,
    news_feature_mode: row.news_feature_mode,
    news_featured_item_id: row.news_featured_item_id,
    news_list_count: row.news_list_count,
    news_show_dates: row.news_show_dates,
    news_cta_label: row.news_cta_label,
    news_cta_href: row.news_cta_href,
    quote_text: row.quote_text,
    quote_author: row.quote_author,
    background_style: row.background_style,
    background_image_id: row.background_image_id,
    background_overlay_strength: row.background_overlay_strength,
    gateway_items: row.gateway_items || [],
    gateway_columns_desktop: row.gateway_columns_desktop,
    gateway_columns_tablet: row.gateway_columns_tablet,
    gateway_columns_mobile: row.gateway_columns_mobile,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const create = async (data) => {
  const cleanedEntries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (!cleanedEntries.length) {
    throw new Error('No fields provided to create.');
  }

  const columns = cleanedEntries.map(([key]) => key);
  const values = cleanedEntries.map(([, value]) => value);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

  const query = `
    INSERT INTO homepage_blocks
      (${columns.join(', ')}, created_at, updated_at)
    VALUES
      (${placeholders}, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapBlock(rows[0]);
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

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    const columnMap = {
      block_type: 'block_type',
      display_order: 'display_order',
      is_published: 'is_published',
      published_at: 'published_at',
      title: 'title',
      subtitle: 'subtitle',
      body: 'body',
      cta_label: 'cta_label',
      cta_href: 'cta_href',
      theme_variant: 'theme_variant',
      container_width: 'container_width',
      media_image_id: 'media_image_id',
      media_alt_text: 'media_alt_text',
      layout_variant: 'layout_variant',
      hof_selection_mode: 'hof_selection_mode',
      hof_items_count: 'hof_items_count',
      hof_manual_item_ids: 'hof_manual_item_ids',
      hof_filter_tag: 'hof_filter_tag',
      hof_show_cta: 'hof_show_cta',
      hof_cta_label: 'hof_cta_label',
      hof_cta_href: 'hof_cta_href',
      news_source: 'news_source',
      news_feature_mode: 'news_feature_mode',
      news_featured_item_id: 'news_featured_item_id',
      news_list_count: 'news_list_count',
      news_show_dates: 'news_show_dates',
      news_cta_label: 'news_cta_label',
      news_cta_href: 'news_cta_href',
      quote_text: 'quote_text',
      quote_author: 'quote_author',
      background_style: 'background_style',
      background_image_id: 'background_image_id',
      background_overlay_strength: 'background_overlay_strength',
      gateway_items: 'gateway_items',
      gateway_columns_desktop: 'gateway_columns_desktop',
      gateway_columns_tablet: 'gateway_columns_tablet',
      gateway_columns_mobile: 'gateway_columns_mobile',
    };

    const column = columnMap[key];
    if (!column) {
      return;
    }

    setField(column, value);
  });

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(id);

  const query = `
    UPDATE homepage_blocks
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapBlock(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM homepage_blocks WHERE id = $1', [id]);
  return rowCount > 0;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM homepage_blocks
     ORDER BY display_order ASC NULLS LAST, created_at DESC`
  );
  return rows.map(mapBlock);
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM homepage_blocks
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return mapBlock(rows[0]);
};

module.exports = {
  create,
  update,
  delete: remove,
  getAll,
  getById,
};
