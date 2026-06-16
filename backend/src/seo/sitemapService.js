const { pool } = require('../config/db');
const { canonicalUrl } = require('./descriptors');
const { getSeoConfig } = require('./config');
const { escapeHtml, normalizePath, toIsoDate } = require('./utils');
const { staticRoutes } = require('./routeSeoService');

const STATIC_SITEMAP_PATHS = ['/', ...staticRoutes.keys()];

const queryRows = async (sql) => {
  const { rows } = await pool.query(sql);
  return rows;
};

const buildUrl = (config, path, lastmod) => {
  const pieces = ['<url>', `<loc>${escapeHtml(canonicalUrl(config, path))}</loc>`];
  const iso = toIsoDate(lastmod);
  if (iso) {
    pieces.push(`<lastmod>${escapeHtml(iso)}</lastmod>`);
  }
  pieces.push('</url>');
  return pieces.join('');
};

const loadDynamicUrls = async () => {
  const queries = [
    queryRows("SELECT slug, updated_at FROM news WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM obituaries WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM family_clans WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT COALESCE(slug, company_key) AS slug, updated_at FROM asafo_companies WHERE published = true AND COALESCE(slug, company_key) IS NOT NULL AND COALESCE(slug, company_key) <> ''"),
    queryRows("SELECT slug, updated_at FROM hall_of_fame WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM landmarks WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM leaders WHERE published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM events WHERE is_published = true AND slug IS NOT NULL AND slug <> ''"),
    queryRows("SELECT slug, updated_at FROM announcements WHERE is_published = true AND slug IS NOT NULL AND slug <> ''"),
  ];
  const [
    news,
    obituaries,
    clans,
    asafo,
    hallOfFame,
    landmarks,
    leaders,
    events,
    announcements,
  ] = await Promise.all(queries);

  return [
    ...news.map((row) => [`/news/${row.slug}`, row.updated_at]),
    ...obituaries.map((row) => [`/obituaries/${row.slug}`, row.updated_at]),
    ...clans.map((row) => [`/clans/${row.slug}`, row.updated_at]),
    ...asafo.map((row) => [`/asafo-companies/${row.slug}`, row.updated_at]),
    ...hallOfFame.map((row) => [`/hall-of-fame/${row.slug}`, row.updated_at]),
    ...landmarks.map((row) => [`/landmarks/${row.slug}`, row.updated_at]),
    ...leaders.map((row) => [`/about/leadership-governance/${row.slug}`, row.updated_at]),
    ...events.map((row) => [`/events/${row.slug}`, row.updated_at]),
    ...announcements.map((row) => [`/announcements/${row.slug}`, row.updated_at]),
  ];
};

const buildSitemapXml = async () => {
  const config = getSeoConfig();
  const staticUrls = STATIC_SITEMAP_PATHS.map((path) => [path, null]);
  const dynamicUrls = await loadDynamicUrls();
  const seen = new Set();
  const urls = [...staticUrls, ...dynamicUrls].filter(([path]) => {
    const normalizedPath = normalizePath(path);
    if (seen.has(normalizedPath)) return false;
    seen.add(normalizedPath);
    return true;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map(([path, lastmod]) => buildUrl(config, path, lastmod))
    .join('')}</urlset>`;
};

const buildRobotsTxt = () => {
  const config = getSeoConfig();
  const disallow = ['/admin', '/admin/', '/api/', '/uploads/tmp/', '/preview'];
  const production = process.env.NODE_ENV === 'production';
  const lines = ['User-agent: *'];
  if (production) {
    for (const path of disallow) {
      lines.push(`Disallow: ${path}`);
    }
  } else {
    lines.push('Disallow: /');
  }
  lines.push(`Sitemap: ${canonicalUrl(config, '/sitemap.xml')}`);
  return `${lines.join('\n')}\n`;
};

module.exports = {
  STATIC_SITEMAP_PATHS,
  buildRobotsTxt,
  buildSitemapXml,
};
