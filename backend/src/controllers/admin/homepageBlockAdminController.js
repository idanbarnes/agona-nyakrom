const crypto = require('crypto');
const homepageBlockAdminService = require('../../services/admin/homepageBlockAdminService');
const mediaService = require('../../services/mediaService');
const { success, error } = require('../../utils/response');

const allowedBlockTypes = new Set([
  'editorial_feature',
  'who_we_are',
  'welcome',
  'hall_of_fame_spotlight',
  'news_highlight',
  'cultural_break',
  'gateway_links',
]);
const textContentBlockTypes = new Set(['editorial_feature', 'welcome']);

const allowedThemeVariants = new Set(['default', 'muted', 'accent', 'image_bg']);
const allowedContainerWidths = new Set(['standard', 'wide', 'full_bleed']);
const allowedLayoutVariants = new Set(['image_right', 'image_left', 'text_only']);
const allowedHofSelectionModes = new Set(['random', 'rotate_daily', 'manual']);
const allowedNewsSources = new Set(['news', 'announcements', 'mixed']);
const allowedNewsFeatureModes = new Set(['latest', 'manual']);
const allowedBackgroundStyles = new Set(['solid', 'gradient', 'image']);
const allowedOverlayStrengths = new Set(['low', 'medium', 'high']);
const allowedWhoWeAreStatIcons = new Set([
  'users',
  'heart',
  'award',
  'trending_up',
]);
const blockTypeAliases = new Map([
  ['editorial_feature', 'editorial_feature'],
  ['editorial feature', 'editorial_feature'],
  ['who_we_are', 'who_we_are'],
  ['who we are', 'who_we_are'],
  ['who-we-are', 'who_we_are'],
  ['welcome', 'welcome'],
  ['welcome_block', 'welcome'],
  ['welcome block', 'welcome'],
]);

const normalizeBlockType = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const aliasMatch = blockTypeAliases.get(trimmed.toLowerCase());
  if (aliasMatch) {
    return aliasMatch;
  }

  return trimmed.toLowerCase().replace(/[\s-]+/g, '_');
};

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

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return [];
};

const sanitizeWhoWeAreStats = (value) => {
  const parsed = parseJsonArray(value);
  return (Array.isArray(parsed) ? parsed : []).map((item) => ({
    icon_key: String(item?.icon_key || item?.iconKey || '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_'),
    label: String(item?.label || '').trim(),
    value: String(item?.value || '').trim(),
  }));
};

const sanitizeWhoWeAreGallery = (value) => {
  const parsed = parseJsonArray(value);
  return (Array.isArray(parsed) ? parsed : []).map((item) => ({
    image_id: String(item?.image_id || item?.imageId || '').trim(),
    alt_text: String(item?.alt_text || item?.altText || '').trim(),
  }));
};

const processImageIfPresent = async (file, uniqueId) => {
  if (!file) return null;
  return mediaService.processImage(file, 'homepage', uniqueId);
};

const listUploadedFiles = (req) => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (!req.files || typeof req.files !== 'object') {
    return [];
  }

  return Object.entries(req.files).flatMap(([fieldName, files]) =>
    (Array.isArray(files) ? files : [])
      .filter(Boolean)
      .map((file) => ({
        ...file,
        fieldname: file.fieldname || fieldName,
      }))
  );
};

const extractFileFromFields = (req, fieldName) => {
  if (fieldName === 'image' && req.file) {
    return req.file;
  }

  if (Array.isArray(req.files)) {
    const found = req.files.find((file) => file?.fieldname === fieldName);
    if (found) {
      return found;
    }
  }

  const byField = req.files?.[fieldName];
  if (Array.isArray(byField) && byField[0]) {
    return byField[0];
  }

  return null;
};

// Support multer uploads and base64 data URIs
const extractImageFromRequest = (req) => {
  const uploadedImage =
    extractFileFromFields(req, 'image') ||
    extractFileFromFields(req, 'media_image_file');
  if (uploadedImage) return uploadedImage;

  const rawImage = req.body?.image;
  if (typeof rawImage !== 'string') return null;

  const match = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const [, mimetype, base64Payload] = match;
  const buffer = Buffer.from(base64Payload, 'base64');

  return {
    buffer,
    mimetype,
    size: buffer.length,
  };
};

const parseWhoWeAreGalleryIndex = (fieldName) => {
  const normalized = String(fieldName || '');

  const matchDirect = normalized.match(/^who_we_are_gallery_image_(\d+)$/);
  if (matchDirect) {
    return Number(matchDirect[1]);
  }

  const matchLegacy = normalized.match(/^who_we_are_gallery_(\d+)_image$/);
  if (matchLegacy) {
    return Number(matchLegacy[1]);
  }

  return null;
};

const extractWhoWeAreGalleryFilesFromRequest = (req) => {
  const filesByIndex = new Map();

  listUploadedFiles(req).forEach((file) => {
    const index = parseWhoWeAreGalleryIndex(file?.fieldname);
    if (index === null || Number.isNaN(index) || index < 0 || index > 3) {
      return;
    }

    if (!filesByIndex.has(index)) {
      filesByIndex.set(index, file);
    }
  });

  for (let index = 0; index < 4; index += 1) {
    const file =
      filesByIndex.get(index) ||
      extractFileFromFields(req, `who_we_are_gallery_image_${index}`) ||
      extractFileFromFields(req, `who_we_are_gallery_${index}_image`);
    if (file) {
      filesByIndex.set(index, file);
    }
  }

  return filesByIndex;
};

const ensureGalleryLength = (gallery, count = 4) => {
  const normalized = Array.isArray(gallery)
    ? gallery.map((item) => ({
      image_id: String(item?.image_id || '').trim(),
      alt_text: String(item?.alt_text || '').trim(),
    }))
    : [];

  while (normalized.length < count) {
    normalized.push({ image_id: '', alt_text: '' });
  }

  return normalized.slice(0, count);
};

const applyWhoWeAreGalleryUploads = async (
  payload,
  req,
  uniqueId,
  fallbackGallery = []
) => {
  const uploadedFiles = extractWhoWeAreGalleryFilesFromRequest(req);
  if (!uploadedFiles.size) {
    return;
  }

  const gallery = ensureGalleryLength(
    payload.who_we_are_gallery !== undefined
      ? payload.who_we_are_gallery
      : fallbackGallery
  );

  for (const [index, file] of uploadedFiles.entries()) {
    const images = await processImageIfPresent(file, `${uniqueId}-who-we-are-${index + 1}`);
    gallery[index] = {
      ...gallery[index],
      image_id: images?.original || gallery[index]?.image_id || '',
    };
  }

  payload.who_we_are_gallery = gallery;
};

const normalizeBlockPayload = (payload, { mode = 'create' } = {}) => {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(payload, field);
  const getString = (field) =>
    hasField(field) ? payload[field]?.trim() || null : undefined;

  const normalized = {
    title: getString('title'),
    block_type: hasField('block_type')
      ? normalizeBlockType(payload.block_type)
      : undefined,
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
    secondary_cta_label: getString('secondary_cta_label'),
    secondary_cta_href: getString('secondary_cta_href'),
    theme_variant: hasField('theme_variant') ? payload.theme_variant : undefined,
    container_width: hasField('container_width') ? payload.container_width : undefined,
    media_image_id: getString('media_image_id'),
    media_alt_text: getString('media_alt_text'),
    layout_variant: hasField('layout_variant') ? payload.layout_variant : undefined,
    who_we_are_paragraph_one: getString('who_we_are_paragraph_one'),
    who_we_are_paragraph_two: getString('who_we_are_paragraph_two'),
    who_we_are_stats: hasField('who_we_are_stats')
      ? sanitizeWhoWeAreStats(payload.who_we_are_stats)
      : undefined,
    who_we_are_gallery: hasField('who_we_are_gallery')
      ? sanitizeWhoWeAreGallery(payload.who_we_are_gallery)
      : undefined,
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
      ? parseJsonArray(payload.gateway_items)
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
    secondary_cta_label: null,
    secondary_cta_href: null,
    theme_variant: 'default',
    container_width: 'standard',
    media_image_id: null,
    media_alt_text: null,
    layout_variant: 'image_right',
    who_we_are_paragraph_one: null,
    who_we_are_paragraph_two: null,
    who_we_are_stats: [],
    who_we_are_gallery: [],
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

const validateBlock = (
  data,
  { allowMissingType = false, requireDisplayOrder = true } = {}
) => {
  const errors = [];
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

  if (!allowMissingType) {
    if (!data.block_type || !allowedBlockTypes.has(data.block_type)) {
      errors.push('block_type must be one of the supported block types.');
    }
  } else if (data.block_type && !allowedBlockTypes.has(data.block_type)) {
    errors.push('block_type must be one of the supported block types.');
  }

  if (
    requireDisplayOrder &&
    (data.display_order === null || data.display_order === undefined)
  ) {
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

  const hasPrimaryCtaLabel = hasText(data.cta_label);
  const hasPrimaryCtaHref = hasText(data.cta_href);
  if (hasPrimaryCtaLabel !== hasPrimaryCtaHref) {
    errors.push('cta_label and cta_href must both be provided together.');
  }

  if (data.block_type === 'who_we_are') {
    if (Array.isArray(data.who_we_are_stats) && data.who_we_are_stats.length > 0) {
      if (data.who_we_are_stats.length !== 4) {
        errors.push('who_we_are_stats must contain exactly 4 items.');
      }

      data.who_we_are_stats.forEach((item, index) => {
        if (!item?.label || !item?.value || !item?.icon_key) {
          errors.push(`who_we_are_stats[${index}] requires icon_key, label, and value.`);
          return;
        }

        if (!allowedWhoWeAreStatIcons.has(item.icon_key)) {
          errors.push(
            `who_we_are_stats[${index}] icon_key must be one of: ${Array.from(allowedWhoWeAreStatIcons).join(', ')}.`
          );
        }
      });
    }

    if (Array.isArray(data.who_we_are_gallery) && data.who_we_are_gallery.length > 0) {
      if (data.who_we_are_gallery.length !== 4) {
        errors.push('who_we_are_gallery must contain exactly 4 items.');
      }

      data.who_we_are_gallery.forEach((item, index) => {
        if (!item?.image_id) {
          errors.push(`who_we_are_gallery[${index}] requires image_id.`);
        }
      });
    }
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
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

  if (!data.is_published) {
    return errors;
  }

  if (data.display_order === null || data.display_order === undefined) {
    errors.push('display_order is required.');
  }

  if (textContentBlockTypes.has(data.block_type)) {
    if (!data.title && !data.subtitle && !data.body) {
      errors.push('This block type needs a title, subtitle, or body to publish.');
    }
  }

  if (data.block_type === 'who_we_are') {
    if (!hasText(data.title)) {
      errors.push('Who We Are requires a title to publish.');
    }
    if (!hasText(data.subtitle)) {
      errors.push('Who We Are requires a subtitle to publish.');
    }
    if (!hasText(data.who_we_are_paragraph_one)) {
      errors.push('Who We Are requires paragraph one to publish.');
    }
    if (!hasText(data.cta_label) || !hasText(data.cta_href)) {
      errors.push('Who We Are requires the primary CTA label and link to publish.');
    }
    if (!Array.isArray(data.who_we_are_stats) || data.who_we_are_stats.length !== 4) {
      errors.push('Who We Are requires exactly 4 stats to publish.');
    }
    if (!Array.isArray(data.who_we_are_gallery) || data.who_we_are_gallery.length !== 4) {
      errors.push('Who We Are requires exactly 4 gallery images to publish.');
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
    const uniqueId = crypto.randomUUID();
    const imageFile = extractImageFromRequest(req);
    if (imageFile) {
      const images = await processImageIfPresent(imageFile, uniqueId);
      payload.media_image_id = images?.original || null;
    }
    if (payload.block_type === 'who_we_are') {
      await applyWhoWeAreGalleryUploads(payload, req, uniqueId);
    }

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
    if (err.message.toLowerCase().includes('json')) {
      return error(
        res,
        'Invalid JSON payload for gateway_items, who_we_are_stats, or who_we_are_gallery.',
        400
      );
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
    const uniqueId = existing?.id || crypto.randomUUID();
    const imageFile = extractImageFromRequest(req);
    if (imageFile) {
      const images = await processImageIfPresent(imageFile, uniqueId);
      payload.media_image_id = images?.original || null;
    }
    const targetBlockType = payload.block_type || existing.block_type;
    if (targetBlockType === 'who_we_are') {
      await applyWhoWeAreGalleryUploads(
        payload,
        req,
        uniqueId,
        existing?.who_we_are_gallery || []
      );
    }
    const merged = { ...existing, ...payload };

    const validationErrors = validateBlock(merged, {
      allowMissingType: true,
      requireDisplayOrder: false,
    });
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
    if (err.message.toLowerCase().includes('json')) {
      return error(
        res,
        'Invalid JSON payload for gateway_items, who_we_are_stats, or who_we_are_gallery.',
        400
      );
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
