const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'content_view',
  'search_performed',
  'search_result_clicked',
  'zero_result_search',
  'share_clicked',
  'related_content_clicked',
  'outbound_link_clicked',
  'contact_action_clicked',
  'read_depth',
]);

const ALLOWED_CONTENT_TYPES = new Set([
  'home',
  'news',
  'obituary',
  'family_clan',
  'asafo_company',
  'landmark',
  'hall_of_fame',
  'leader',
  'event',
  'announcement',
  'about',
  'contact',
  'faq',
]);

const ALLOWED_REFERRER_CATEGORIES = new Set([
  'direct',
  'internal',
  'search',
  'social',
  'referral',
  'campaign',
]);

const ALLOWED_DEVICE_CATEGORIES = new Set(['desktop', 'tablet', 'mobile', 'unknown']);
const READ_DEPTH_MILESTONES = new Set([25, 50, 75, 90]);
const SAFE_METADATA_KEYS = new Set(['target_type', 'target_domain', 'target_path', 'result_type']);
const CAMPAIGN_KEYS = {
  utm_source: 'campaign_source',
  utm_medium: 'campaign_medium',
  utm_campaign: 'campaign_name',
  utm_term: 'campaign_term',
  utm_content: 'campaign_content',
};

const SENSITIVE_QUERY_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?\d[\d\s().-]{7,}\d)/,
  /\b(?:password|secret|token|jwt|authorization|bearer|ssn|passport)\b/i,
  /\b[A-Za-z0-9_-]{32,}\b/,
];

const SEARCH_ENGINES = [
  'google.',
  'bing.',
  'duckduckgo.',
  'yahoo.',
  'ecosia.',
  'baidu.',
  'yandex.',
];

const SOCIAL_HOSTS = [
  'facebook.',
  'instagram.',
  'twitter.',
  'x.com',
  'linkedin.',
  'whatsapp.',
  'tiktok.',
  'youtube.',
];

const BOT_UA_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /headless/i,
  /phantom/i,
  /lighthouse/i,
  /pagespeed/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
];

const normalizeString = (value, maxLength) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, maxLength);
};

const isLikelyBot = (userAgent = '') => BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));

const sanitizeSearchQuery = (value) => {
  const normalized = normalizeString(value, 96);
  if (!normalized) {
    return null;
  }
  if (SENSITIVE_QUERY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return '[redacted-sensitive-query]';
  }
  return normalized;
};

const stripSensitiveSearchParams = (searchParams) => {
  const next = new URLSearchParams();
  Object.keys(CAMPAIGN_KEYS).forEach((key) => {
    const value = normalizeString(searchParams.get(key), 128);
    if (value) {
      next.set(key, value);
    }
  });
  return next;
};

const normalizePath = (value) => {
  const raw = normalizeString(value, 512) || '/';
  try {
    const parsed = new URL(raw, 'https://analytics.local');
    const pathname = `/${parsed.pathname.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
    const safeQuery = stripSensitiveSearchParams(parsed.searchParams).toString();
    return safeQuery ? `${pathname}?${safeQuery}` : pathname;
  } catch {
    const pathOnly = raw.split('?')[0].split('#')[0] || '/';
    return `/${pathOnly.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/').slice(0, 512);
  }
};

const normalizeRoutePattern = (path) => {
  const pathname = normalizePath(path).split('?')[0];
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) {
    return '/';
  }
  if (segments.length === 2) {
    const detailRoots = new Set([
      'news',
      'obituaries',
      'clans',
      'asafo-companies',
      'landmarks',
      'hall-of-fame',
      'events',
      'announcements',
    ]);
    if (detailRoots.has(segments[0])) {
      return `/${segments[0]}/:slug`;
    }
  }
  if (segments.length === 3 && segments[0] === 'about' && segments[1] === 'leadership-governance') {
    return '/about/leadership-governance/:slug';
  }
  if (segments.length === 2 && segments[0] === 'about') {
    return '/about/:slug';
  }
  return pathname;
};

const classifyReferrer = ({ referrer, currentOrigin, hasCampaign }) => {
  if (hasCampaign) {
    return 'campaign';
  }
  const raw = normalizeString(referrer, 512);
  if (!raw) {
    return 'direct';
  }
  try {
    const parsed = new URL(raw);
    const current = currentOrigin ? new URL(currentOrigin) : null;
    const host = parsed.hostname.toLowerCase();
    if (current && host === current.hostname.toLowerCase()) {
      return 'internal';
    }
    if (SEARCH_ENGINES.some((domain) => host.includes(domain))) {
      return 'search';
    }
    if (SOCIAL_HOSTS.some((domain) => host.includes(domain))) {
      return 'social';
    }
    return 'referral';
  } catch {
    return 'direct';
  }
};

const normalizeCampaign = (payload = {}) => {
  const source = payload.campaign || payload.campaigns || {};
  const output = {};
  Object.entries(CAMPAIGN_KEYS).forEach(([inputKey, outputKey]) => {
    const value =
      normalizeString(source[inputKey], 128) ||
      normalizeString(source[outputKey], 128) ||
      normalizeString(payload[inputKey], 128);
    if (value) {
      output[outputKey] = value;
    }
  });
  return output;
};

const normalizeMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => SAFE_METADATA_KEYS.has(key))
      .map(([key, value]) => [key, normalizeString(String(value), 96)])
      .filter(([, value]) => value)
  );
};

const parseInteger = (value, { min = 0, max = 100000 } = {}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
};

const validateAnalyticsEvent = (payload = {}, context = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('Analytics event payload must be an object.');
    error.status = 400;
    throw error;
  }

  const eventType = normalizeString(payload.event_type || payload.eventType, 64);
  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    const error = new Error('Unknown analytics event type.');
    error.status = 400;
    throw error;
  }

  const anonSessionId = normalizeString(
    payload.anon_session_id || payload.session_id || payload.sessionId,
    64
  );
  if (!anonSessionId || !/^[A-Za-z0-9_-]{16,64}$/.test(anonSessionId)) {
    const error = new Error('Invalid anonymous session identifier.');
    error.status = 400;
    throw error;
  }

  const campaign = normalizeCampaign(payload);
  const routePath = normalizePath(payload.page_path || payload.path || payload.route_path);
  const contentType = normalizeString(payload.content_type || payload.contentType, 64);
  const deviceCategory = normalizeString(payload.device_category || payload.deviceCategory, 32);
  const referrerCategory =
    normalizeString(payload.referrer_category || payload.referrerCategory, 32) ||
    classifyReferrer({
      referrer: payload.referrer,
      currentOrigin: context.currentOrigin,
      hasCampaign: Object.keys(campaign).length > 0,
    });

  if (contentType && !ALLOWED_CONTENT_TYPES.has(contentType)) {
    const error = new Error('Unknown analytics content type.');
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_REFERRER_CATEGORIES.has(referrerCategory)) {
    const error = new Error('Unknown referrer category.');
    error.status = 400;
    throw error;
  }

  if (deviceCategory && !ALLOWED_DEVICE_CATEGORIES.has(deviceCategory)) {
    const error = new Error('Unknown device category.');
    error.status = 400;
    throw error;
  }

  const readDepth = parseInteger(payload.read_depth_percent || payload.readDepthPercent);
  if (eventType === 'read_depth' && !READ_DEPTH_MILESTONES.has(readDepth)) {
    const error = new Error('Invalid read-depth milestone.');
    error.status = 400;
    throw error;
  }

  const occurredAt = new Date();
  const searchQuery =
    eventType.startsWith('search') || eventType === 'zero_result_search'
      ? sanitizeSearchQuery(payload.search_query || payload.searchQuery || payload.query)
      : null;

  return {
    event_type: eventType,
    occurred_at: occurredAt,
    anon_session_id: anonSessionId,
    route_path: routePath,
    route_pattern: normalizeString(payload.route_pattern || payload.routePattern, 128) || normalizeRoutePattern(routePath),
    page_title: normalizeString(payload.page_title || payload.pageTitle, 160),
    content_type: contentType,
    content_id: normalizeString(payload.content_id || payload.contentId, 96),
    content_slug: normalizeString(payload.content_slug || payload.contentSlug, 160),
    referrer_category: referrerCategory,
    device_category: deviceCategory || 'unknown',
    ...campaign,
    read_depth_percent: eventType === 'read_depth' ? readDepth : null,
    search_query: searchQuery,
    search_result_count: parseInteger(payload.search_result_count || payload.resultCount),
    search_result_position: parseInteger(payload.search_result_position || payload.resultPosition, {
      min: 1,
      max: 1000,
    }),
    metadata: normalizeMetadata(payload.metadata),
  };
};

module.exports = {
  ALLOWED_EVENT_TYPES,
  isLikelyBot,
  normalizePath,
  normalizeRoutePattern,
  sanitizeSearchQuery,
  validateAnalyticsEvent,
};
