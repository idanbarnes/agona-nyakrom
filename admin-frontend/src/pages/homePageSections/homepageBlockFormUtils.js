const INTERNAL_LINK_OPTIONS = [
  { value: '/history', label: 'History' },
  { value: '/clans', label: 'Family Clans' },
  { value: '/asafo-companies', label: 'Asafo Companies' },
  { value: '/obituaries', label: 'Obituaries' },
  { value: '/hall-of-fame', label: 'Hall of Fame' },
  { value: '/landmarks', label: 'Landmarks' },
  { value: '/news', label: 'News' },
  { value: '/news', label: 'Updates' },
  { value: '/announcements-events', label: 'Announcements' },
  { value: '/announcements-events', label: 'Events' },
]

export const ICON_KEY_OPTIONS = [
  { value: '', label: 'Select icon' },
  { value: 'history', label: 'History' },
  { value: 'clans', label: 'Family Clans' },
  { value: 'asafo', label: 'Asafo Companies' },
  { value: 'obituaries', label: 'Obituaries' },
  { value: 'hall_of_fame', label: 'Hall of Fame' },
  { value: 'landmarks', label: 'Landmarks' },
  { value: 'news', label: 'News' },
  { value: 'updates', label: 'Updates' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'events', label: 'Events' },
]

export const COMMON_FIELDS = [
  'block_type',
  'display_order',
  'is_published',
  'theme_variant',
  'container_width',
  'title',
  'subtitle',
]

const TYPE_DEFAULTS = {
  body: '',
  cta_label: '',
  cta_href: '',
  layout_variant: 'image_right',
  media_alt_text: '',
  media_image_id: '',
  hof_selection_mode: 'random',
  hof_items_count: 3,
  hof_manual_item_ids: [],
  hof_filter_tag: '',
  hof_show_cta: true,
  hof_cta_label: 'View Hall of Fame',
  hof_cta_href: '/hall-of-fame',
  news_source: 'news',
  news_feature_mode: 'latest',
  news_featured_item_id: '',
  news_list_count: 4,
  news_show_dates: true,
  news_cta_label: 'View Updates',
  news_cta_href: '/updates',
  quote_text: '',
  quote_author: '',
  background_style: 'solid',
  background_overlay_strength: 'medium',
  background_image_id: '',
  gateway_items: [],
  gateway_columns_desktop: 3,
  gateway_columns_tablet: 2,
  gateway_columns_mobile: 1,
}

export const getBlockTypeConfig = () => ({
  editorial_feature: {
    fields: [
      'body',
      'cta_label',
      'cta_href',
      'layout_variant',
      'media_alt_text',
      'media_image_id',
    ],
  },
  hall_of_fame_spotlight: {
    fields: [
      'hof_selection_mode',
      'hof_items_count',
      'hof_manual_item_ids',
      'hof_filter_tag',
      'hof_show_cta',
      'hof_cta_label',
      'hof_cta_href',
    ],
  },
  news_highlight: {
    fields: [
      'news_source',
      'news_feature_mode',
      'news_featured_item_id',
      'news_list_count',
      'news_show_dates',
      'news_cta_label',
      'news_cta_href',
    ],
  },
  cultural_break: {
    fields: [
      'quote_text',
      'quote_author',
      'background_style',
      'background_overlay_strength',
      'background_image_id',
    ],
  },
  gateway_links: {
    fields: [
      'gateway_items',
      'gateway_columns_desktop',
      'gateway_columns_tablet',
      'gateway_columns_mobile',
    ],
  },
})

export const resetTypeSpecificFields = (formState, blockType) => {
  const config = getBlockTypeConfig()[blockType] || { fields: [] }
  const nextState = { ...formState }

  Object.keys(TYPE_DEFAULTS).forEach((key) => {
    if (!config.fields.includes(key)) {
      nextState[key] = TYPE_DEFAULTS[key]
    }
  })

  if (blockType !== 'editorial_feature') {
    nextState.media_image_id = TYPE_DEFAULTS.media_image_id
  }

  if (blockType !== 'gateway_links') {
    nextState.gateway_items = TYPE_DEFAULTS.gateway_items
  }

  return nextState
}

const isDefined = (value) => value !== undefined && value !== null

const toNumber = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) {
    return fallback
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

export const sanitizeGatewayItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      label: item?.label?.trim() || '',
      description: item?.description?.trim() || '',
      href: item?.href?.trim() || '',
      icon_key: item?.icon_key?.trim() || '',
      image_id: item?.image_id?.trim() || '',
      badge: item?.badge?.trim() || '',
      display_order: item?.display_order ?? index + 1,
    }))
    .filter((item) => item.label || item.href)

export const buildPayload = (formState, blockType) => {
  const basePayload = {
    block_type: formState.block_type,
    display_order: toNumber(formState.display_order, null),
    is_published: formState.is_published,
    theme_variant: formState.theme_variant,
    container_width: formState.container_width,
    title: formState.title?.trim() || '',
    subtitle: formState.subtitle?.trim() || '',
  }

  const config = getBlockTypeConfig()[blockType] || { fields: [] }
  const typePayload = {}

  const addField = (key, value) => {
    if (isDefined(value)) {
      typePayload[key] = value
    }
  }

  if (config.fields.includes('body')) {
    addField('body', formState.body?.trim() || '')
    addField('cta_label', formState.cta_label?.trim() || '')
    addField('cta_href', formState.cta_href?.trim() || '')
    addField('layout_variant', formState.layout_variant)
    addField('media_alt_text', formState.media_alt_text?.trim() || '')
    addField('media_image_id', formState.media_image_id?.trim() || '')
  }

  if (config.fields.includes('hof_selection_mode')) {
    addField('hof_selection_mode', formState.hof_selection_mode)
    addField('hof_items_count', toNumber(formState.hof_items_count, 0))
    if (formState.hof_selection_mode === 'manual') {
      addField('hof_manual_item_ids', formState.hof_manual_item_ids || [])
    }
    addField('hof_filter_tag', formState.hof_filter_tag?.trim() || '')
    addField('hof_show_cta', formState.hof_show_cta)
    if (formState.hof_show_cta) {
      addField('hof_cta_label', formState.hof_cta_label?.trim() || '')
      addField('hof_cta_href', formState.hof_cta_href?.trim() || '')
    }
  }

  if (config.fields.includes('news_source')) {
    addField('news_source', formState.news_source)
    addField('news_feature_mode', formState.news_feature_mode)
    if (formState.news_feature_mode === 'manual') {
      addField('news_featured_item_id', formState.news_featured_item_id?.trim() || '')
    }
    addField('news_list_count', toNumber(formState.news_list_count, 0))
    addField('news_show_dates', formState.news_show_dates)
    addField('news_cta_label', formState.news_cta_label?.trim() || '')
    addField('news_cta_href', formState.news_cta_href?.trim() || '')
  }

  if (config.fields.includes('quote_text')) {
    addField('quote_text', formState.quote_text?.trim() || '')
    addField('quote_author', formState.quote_author?.trim() || '')
    addField('background_style', formState.background_style)
    addField('background_overlay_strength', formState.background_overlay_strength)
    if (formState.background_style === 'image') {
      addField('background_image_id', formState.background_image_id?.trim() || '')
    }
  }

  if (config.fields.includes('gateway_items')) {
    addField('gateway_columns_desktop', toNumber(formState.gateway_columns_desktop, 0))
    addField('gateway_columns_tablet', toNumber(formState.gateway_columns_tablet, 0))
    addField('gateway_columns_mobile', toNumber(formState.gateway_columns_mobile, 0))
    addField('gateway_items', sanitizeGatewayItems(formState.gateway_items))
  }

  return {
    ...basePayload,
    ...typePayload,
  }
}

export const validateByType = (formState, blockType) => {
  const errors = []

  if (!formState.block_type) {
    errors.push('Block type is required.')
  }

  if (formState.display_order === '' || Number.isNaN(Number(formState.display_order))) {
    errors.push('Display order is required.')
  }

  if (blockType === 'editorial_feature') {
    if (!formState.body?.trim()) {
      errors.push('Body is required for editorial features.')
    }
    const hasLabel = Boolean(formState.cta_label?.trim())
    const hasHref = Boolean(formState.cta_href?.trim())
    if (hasLabel !== hasHref) {
      errors.push('CTA label and link must both be provided.')
    }
  }

  if (blockType === 'hall_of_fame_spotlight') {
    if (!formState.hof_selection_mode) {
      errors.push('Selection mode is required.')
    }
    if (!formState.hof_items_count) {
      errors.push('Items count is required.')
    }
    if (
      formState.hof_selection_mode === 'manual' &&
      (!formState.hof_manual_item_ids || formState.hof_manual_item_ids.length === 0)
    ) {
      errors.push('Manual selection requires at least one Hall of Fame item.')
    }
  }

  if (blockType === 'news_highlight') {
    if (!formState.news_source) {
      errors.push('News source is required.')
    }
    if (!formState.news_feature_mode) {
      errors.push('Featured mode is required.')
    }
    if (
      formState.news_feature_mode === 'manual' &&
      !formState.news_featured_item_id?.trim()
    ) {
      errors.push('Manual featured mode requires a featured item ID.')
    }
  }

  if (blockType === 'cultural_break') {
    if (!formState.quote_text?.trim()) {
      errors.push('Quote text is required.')
    }
    if (!formState.background_style) {
      errors.push('Background style is required.')
    }
    if (
      formState.background_style === 'image' &&
      !formState.background_image_id?.trim()
    ) {
      errors.push('Background image is required when using image style.')
    }
  }

  if (blockType === 'gateway_links') {
    const items = sanitizeGatewayItems(formState.gateway_items)
    if (!items.length) {
      errors.push('Add at least one gateway card.')
    } else {
      items.forEach((item, index) => {
        if (!item.label || !item.href) {
          errors.push(`Gateway card ${index + 1} requires a label and link.`)
        }
        if (!/^https?:\/\//.test(item.href) && !item.href.startsWith('/')) {
          errors.push(`Gateway card ${index + 1} link must start with / or http(s).`)
        }
      })
    }
  }

  return errors
}

export const getInternalLinkOptions = () => INTERNAL_LINK_OPTIONS
