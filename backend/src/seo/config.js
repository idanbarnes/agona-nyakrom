const { isHostedRuntime, normalize } = require('../config/env');
const { normalizeOrigin, resolveAbsoluteUrl } = require('./utils');

const SUSPENDED_RENDER_HOSTS = [
  'agonanyakrom.onrender.com',
  'agonanyakrom-admin.onrender.com',
  'agonanyakrom-api.onrender.com',
];

const parseOrigin = (label, value, { requireHttps = false } = {}) => {
  const normalized = normalizeOrigin(value);
  if (!normalized) return '';

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${label} must be an absolute http(s) origin. Received "${value}".`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} must use http or https. Received "${value}".`);
  }

  if (requireHttps && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use https in production. Received "${value}".`);
  }

  return normalizeOrigin(parsed.origin);
};

const isProductionRuntime = () =>
  normalize(process.env.NODE_ENV).toLowerCase() === 'production' || isHostedRuntime();

const getConfiguredSiteOrigin = () => {
  const rawOrigin =
    process.env.SITE_URL ||
    process.env.UNIFIED_SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    (isProductionRuntime() ? '' : 'http://localhost:5000');

  const origin = parseOrigin('SITE_URL', rawOrigin, { requireHttps: isProductionRuntime() });
  if (!origin) {
    throw new Error(
      'SITE_URL is required in production and must be the final HTTPS public origin.'
    );
  }

  const hostname = new URL(origin).hostname.toLowerCase();
  if (isProductionRuntime() && SUSPENDED_RENDER_HOSTS.includes(hostname)) {
    throw new Error('SITE_URL must not use suspended Render service URLs in production.');
  }

  return origin;
};

const getSeoConfig = () => {
  const siteOrigin = getConfiguredSiteOrigin();
  const assetOrigin = parseOrigin(
    'PUBLIC_ASSET_BASE_URL',
    process.env.PUBLIC_ASSET_BASE_URL || siteOrigin,
    { requireHttps: isProductionRuntime() }
  );
  const defaultSocialImage = resolveAbsoluteUrl(process.env.PUBLIC_SHARE_IMAGE_URL || '/share-default.svg', {
    siteOrigin,
    assetOrigin,
    preferSite: true,
  });
  const logoUrl = resolveAbsoluteUrl(process.env.PUBLIC_LOGO_URL || '/vite.svg', {
    siteOrigin,
    assetOrigin,
    preferSite: true,
  });
  const socialProfiles = String(process.env.PUBLIC_SOCIAL_PROFILES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    platformName: 'Agona Nyakrom',
    defaultTitle: 'Agona Nyakrom | Official Public Website',
    titleTemplate: '%s | Agona Nyakrom',
    defaultDescription:
      'Official public website for Agona Nyakrom, featuring community news, history, events, announcements, landmarks, and memorials.',
    siteOrigin,
    assetOrigin,
    defaultSocialImage,
    organizationName: 'Agona Nyakrom',
    logoUrl,
    locale: 'en_GH',
    socialProfiles,
  };
};

module.exports = {
  SUSPENDED_RENDER_HOSTS,
  getSeoConfig,
  parseOrigin,
};
