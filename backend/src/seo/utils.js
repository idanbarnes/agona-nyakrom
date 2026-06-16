const COLLAPSED_SLASHES = /\/{2,}/g;

const normalizeOrigin = (value = '') => String(value || '').trim().replace(/\/+$/, '');

const normalizePath = (value = '/') => {
  const [rawPath] = String(value || '/').split(/[?#]/);
  let pathname = rawPath.trim() || '/';
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }
  pathname = pathname.replace(COLLAPSED_SLASHES, '/');
  if (pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, '');
  }
  return pathname || '/';
};

const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripHtml = (value = '') =>
  String(value ?? '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value = '', maxLength = 200) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
};

const safeJsonLd = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const isAbsoluteHttpUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim());

const isPrivateSeoPath = (pathname = '') =>
  /^\/(?:admin|api|preview)(?:\/|$)/i.test(pathname) || /^\/uploads\/tmp(?:\/|$)/i.test(pathname);

const resolveAbsoluteUrl = (value, { siteOrigin, assetOrigin, defaultUrl, preferSite = false } = {}) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return defaultUrl || '';
  }
  if (isAbsoluteHttpUrl(rawValue)) {
    try {
      const parsed = new URL(rawValue);
      if (isPrivateSeoPath(parsed.pathname)) {
        return defaultUrl || '';
      }
      return parsed.href;
    } catch {
      return defaultUrl || '';
    }
  }
  if (/^\/\//.test(rawValue)) {
    return `https:${rawValue}`;
  }
  if (/^(data:|blob:|javascript:)/i.test(rawValue)) {
    return defaultUrl || '';
  }

  const normalizedPath = normalizePath(rawValue);
  if (isPrivateSeoPath(normalizedPath)) {
    return defaultUrl || '';
  }
  const origin = preferSite || !normalizedPath.startsWith('/uploads/') ? siteOrigin : assetOrigin || siteOrigin;
  return `${normalizeOrigin(origin)}${normalizedPath}`;
};

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

module.exports = {
  escapeHtml,
  isAbsoluteHttpUrl,
  isPrivateSeoPath,
  normalizeOrigin,
  normalizePath,
  resolveAbsoluteUrl,
  safeJsonLd,
  stripHtml,
  toIsoDate,
  truncate,
};
