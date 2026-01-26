const homepageBlockAdminService = require('../../services/admin/homepageBlockAdminService');
const { success, error } = require('../../utils/response');

const allowedBlockTypes = new Set([
  'editorial_feature',
  'hall_of_fame_spotlight',
  'news_highlight',
  'cultural_break',
  'gateway_links',
]);

const allowedThemeVariants = new Set(['default', 'muted', 'accent', 'image_bg']);
const allowedContainerWidths = new Set(['standard', 'wide', 'full_bleed']);
const allowedLayoutVariants = new Set(['image_right', 'image_left', 'text_only']);
const allowedHofSelectionModes = new Set(['random', 'rotate_daily', 'manual']);
const allowedNewsSources = new Set(['news', 'announcements', 'mixed']);
const allowedNewsFeatureModes = new Set(['latest', 'manual']);
const allowedBackgroundStyles = new Set(['solid', 'gradient', 'image']);
const allowedOverlayStrengths = new Set(['low', 'medium', 'high']);

const parseNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

const parseIdArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseGatewayItems = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return [];
};

const normalizeBlockPayload = (payload, { mode = 'create' } = {}) => {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(payload, field);
  const getString = (field) =>
    hasField(field) ? payload[field]?.trim() || null : undefined;

  const normalized = {
    title: getString('title'),
    block_type: hasField('block_type') ? payload.block_type : undefined,
    display_order: hasField('display_order')
      ? parseNumber(payload.display_order, null)
      : undefined,
    is_published: hasField('is_published')
      ? parseBoolean(payload.is_published)
      : undefined,
    subtitle: getString('subtitle'),
    body: getString('body'),
    cta_label: getString('cta_label'),
    cta_href: getString('cta_href'),
    theme_variant: hasField('theme_variant') ? payload.theme_variant : undefined,
    container_width: hasField('container_width') ? payload.container_width : undefined,
    media_image_id: getString('media_image_id'),
    media_alt_text: getString('media_alt_text'),
    layout_variant: hasField('layout_variant') ? payload.layout_variant : undefined,
    hof_selection_mode: hasField('hof_selection_mode')
      ? payload.hof_selection_mode
      : undefined,
    hof_items_count: hasField('hof_items_count')
      ? parseNumber(payload.hof_items_count, undefined)
      : undefined,
    hof_manual_item_ids: hasField('hof_manual_item_ids')
      ? parseIdArray(payload.hof_manual_item_ids)
      : undefined,
    hof_filter_tag: getString('hof_filter_tag'),
    hof_show_cta: hasField('hof_show_cta')
      ? parseBoolean(payload.hof_show_cta)
      : undefined,
    hof_cta_label: getString('hof_cta_label'),
    hof_cta_href: getString('hof_cta_href'),
    news_source: hasField('news_source') ? payload.news_source : undefined,
    news_feature_mode: hasField('news_feature_mode')
      ? payload.news_feature_mode
      : undefined,
    news_featured_item_id: hasField('news_featured_item_id')
      ? payload.news_featured_item_id || null
      : undefined,
    news_list_count: hasField('news_list_count')
      ? parseNumber(payload.news_list_count, undefined)
      : undefined,
    news_show_dates: hasField('news_show_dates')
      ? parseBoolean(payload.news_show_dates)
      : undefined,
    news_cta_label: getString('news_cta_label'),
    news_cta_href: getString('news_cta_href'),
    quote_text: getString('quote_text'),
    quote_author: getString('quote_author'),
    background_style: hasField('background_style')
      ? payload.background_style
      : undefined,
    background_image_id: getString('background_image_id'),
    background_overlay_strength: hasField('background_overlay_strength')
      ? payload.background_overlay_strength
      : undefined,
    gateway_items: hasField('gateway_items')
      ? parseGatewayItems(payload.gateway_items)
      : undefined,
    gateway_columns_desktop: hasField('gateway_columns_desktop')
      ? parseNumber(payload.gateway_columns_desktop, undefined)
      : undefined,
    gateway_columns_tablet: hasField('gateway_columns_tablet')
      ? parseNumber(payload.gateway_columns_tablet, undefined)
      : undefined,
    gateway_columns_mobile: hasField('gateway_columns_mobile')
      ? parseNumber(payload.gateway_columns_mobile, undefined)
      : undefined,
  };

  if (mode !== 'create') {
    return normalized;
  }

  return {
    title: null,
    block_type: undefined,
    display_order: null,
    is_published: false,
    subtitle: null,
    body: null,
    cta_label: null,
    cta_href: null,
    theme_variant: 'default',
    container_width: 'standard',
    media_image_id: null,
    media_alt_text: null,
    layout_variant: 'image_right',
    hof_selection_mode: 'random',
    hof_items_count: 3,
    hof_manual_item_ids: [],
    hof_filter_tag: null,
    hof_show_cta: true,
    hof_cta_label: 'View Hall of Fame',
    hof_cta_href: '/hall-of-fame',
    news_source: 'news',
    news_feature_mode: 'latest',
    news_featured_item_id: null,
    news_list_count: 4,
    news_show_dates: true,
    news_cta_label: 'View Updates',
    news_cta_href: '/updates',
    quote_text: null,
    quote_author: null,
    background_style: 'solid',
    background_image_id: null,
    background_overlay_strength: 'medium',
    gateway_items: [],
    gateway_columns_desktop: 3,
    gateway_columns_tablet: 2,
    gateway_columns_mobile: 1,
    ...normalized,
  };
};

const validateBlock = (data, { allowMissingType = false } = {}) => {
  const errors = [];

  if (!allowMissingType) {
    if (!data.block_type || !allowedBlockTypes.has(data.block_type)) {
      errors.push('block_type must be one of the supported block types.');
    }
  } else if (data.block_type && !allowedBlockTypes.has(data.block_type)) {
    errors.push('block_type must be one of the supported block types.');
  }

  if (data.display_order === null || data.display_order === undefined) {
    errors.push('display_order is required.');
  }

  if (data.theme_variant && !allowedThemeVariants.has(data.theme_variant)) {
    errors.push('theme_variant is invalid.');
  }

  if (data.container_width && !allowedContainerWidths.has(data.container_width)) {
    errors.push('container_width is invalid.');
  }

  if (data.layout_variant && !allowedLayoutVariants.has(data.layout_variant)) {
    errors.push('layout_variant is invalid.');
  }

  if (data.hof_selection_mode && !allowedHofSelectionModes.has(data.hof_selection_mode)) {
    errors.push('hof_selection_mode is invalid.');
  }

  if (data.news_source && !allowedNewsSources.has(data.news_source)) {
    errors.push('news_source is invalid.');
  }

  if (data.news_feature_mode && !allowedNewsFeatureModes.has(data.news_feature_mode)) {
    errors.push('news_feature_mode is invalid.');
  }

  if (data.background_style && !allowedBackgroundStyles.has(data.background_style)) {
    errors.push('background_style is invalid.');
  }

  if (data.background_overlay_strength && !allowedOverlayStrengths.has(data.background_overlay_strength)) {
    errors.push('background_overlay_strength is invalid.');
  }

  if (data.block_type === 'cultural_break' && !data.quote_text) {
    errors.push('quote_text is required for cultural_break.');
  }

  if (data.block_type === 'gateway_links') {
    if (!Array.isArray(data.gateway_items) || data.gateway_items.length === 0) {
      errors.push('gateway_items must include at least one link.');
    } else {
      const invalidItem = data.gateway_items.find(
        (item) => !item || !item.label || !item.href
      );
      if (invalidItem) {
        errors.push('Each gateway item must include label and href.');
      }
    }
  }

  return errors;
};

const validatePublishedRequirements = (data) => {
  const errors = [];

  if (!data.is_published) {
    return errors;
  }

  if (data.block_type === 'editorial_feature') {
    if (!data.title && !data.subtitle && !data.body) {
      errors.push('Editorial feature blocks need a title, subtitle, or body to publish.');
    }
  }

  if (data.block_type === 'hall_of_fame_spotlight') {
    if (!data.hof_items_count || data.hof_items_count < 1) {
      errors.push('Hall of fame spotlight must show at least one item.');
    }
    if (data.hof_selection_mode === 'manual' && (!data.hof_manual_item_ids || data.hof_manual_item_ids.length === 0)) {
      errors.push('Manual hall of fame spotlight requires selected items.');
    }
  }

  if (data.block_type === 'news_highlight') {
    if (!data.news_list_count || data.news_list_count < 1) {
      errors.push('News highlight must show at least one list item.');
    }
    if (data.news_feature_mode === 'manual' && !data.news_featured_item_id) {
      errors.push('Manual news highlight requires a featured item.');
    }
  }

  if (data.block_type === 'cultural_break' && !data.quote_text) {
    errors.push('Cultural break requires quote_text to publish.');
  }

  if (data.block_type === 'gateway_links') {
    if (!Array.isArray(data.gateway_items) || data.gateway_items.length === 0) {
      errors.push('Gateway links require at least one item to publish.');
    }
  }

  return errors;
};

const preparePublishState = (data, existing) => {
  if (data.is_published === undefined) {
    return data;
  }

  if (data.is_published && !existing?.is_published) {
    return { ...data, published_at: new Date() };
  }

  if (!data.is_published) {
    return { ...data, published_at: null };
  }

  return data;
};

// POST /
const createHomepageBlock = async (req, res) => {
  try {
    const payload = normalizeBlockPayload(req.body || {}, { mode: 'create' });

    const validationErrors = validateBlock(payload);
    const publishErrors = validatePublishedRequirements(payload);
    const errors = [...validationErrors, ...publishErrors];

    if (errors.length > 0) {
      return error(res, errors.join(' '), 400);
    }

    const prepared = preparePublishState(payload, null);
    const created = await homepageBlockAdminService.create(prepared);
    return success(res, created, 'Homepage block created successfully', 201);
  } catch (err) {
    console.error('Error creating homepage block:', err.message);
    if (err.message === 'No fields provided to create.') {
      return error(res, err.message, 400);
    }
    if (err.message.includes('JSON')) {
      return error(res, 'Invalid gateway_items JSON payload.', 400);
    }
    return error(res, 'Failed to create homepage block', 500);
  }
};

// PUT /:id
const updateHomepageBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await homepageBlockAdminService.getById(id);

    if (!existing) {
      return error(res, 'Homepage block not found', 404);
    }

    const payload = normalizeBlockPayload(req.body || {}, { mode: 'update' });
    const merged = { ...existing, ...payload };

    const validationErrors = validateBlock(merged, { allowMissingType: true });
    const publishErrors = validatePublishedRequirements(merged);
    const errors = [...validationErrors, ...publishErrors];

    if (errors.length > 0) {
      return error(res, errors.join(' '), 400);
    }

    const prepared = preparePublishState(payload, existing);
    const updated = await homepageBlockAdminService.update(id, prepared);
    return success(res, updated, 'Homepage block updated successfully');
  } catch (err) {
    console.error('Error updating homepage block:', err.message);
    if (err.message === 'No fields provided to update.') {
      return error(res, err.message, 400);
    }
    if (err.message.includes('JSON')) {
      return error(res, 'Invalid gateway_items JSON payload.', 400);
    }
    return error(res, 'Failed to update homepage block', 500);
  }
};

// DELETE /:id
const deleteHomepageBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await homepageBlockAdminService.getById(id);
    if (!existing) {
      return error(res, 'Homepage block not found', 404);
    }

    await homepageBlockAdminService.delete(id);
    return success(res, { id }, 'Homepage block deleted successfully');
  } catch (err) {
    console.error('Error deleting homepage block:', err.message);
    return error(res, 'Failed to delete homepage block', 500);
  }
};

// GET /
const getAllHomepageBlocks = async (req, res) => {
  try {
    const items = await homepageBlockAdminService.getAll();
    return success(res, items, 'Homepage blocks fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage blocks (admin):', err.message);
    return error(res, 'Failed to fetch homepage blocks', 500);
  }
};

// GET /:id
const getSingleHomepageBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await homepageBlockAdminService.getById(id);
    if (!item) {
      return error(res, 'Homepage block not found', 404);
    }
    return success(res, item, 'Homepage block fetched successfully');
  } catch (err) {
    console.error('Error fetching homepage block (single):', err.message);
    return error(res, 'Failed to fetch homepage block', 500);
  }
};

module.exports = {
  createHomepageBlock,
  updateHomepageBlock,
  deleteHomepageBlock,
  getAllHomepageBlocks,
  getSingleHomepageBlock,
};
