const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const resetSeoEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.SITE_URL = 'http://localhost:5000';
  process.env.PUBLIC_ASSET_BASE_URL = 'http://localhost:5000';
  process.env.PUBLIC_SHARE_IMAGE_URL = 'http://localhost:5000/share-default.svg';
  delete process.env.UNIFIED_SITE_URL;
  delete process.env.PUBLIC_SITE_URL;
};

test.beforeEach(resetSeoEnv);

test('canonical URL generation normalizes duplicate slashes and query strings', () => {
  const { canonicalUrl } = require('../src/seo/descriptors');
  const { getSeoConfig } = require('../src/seo/config');

  assert.equal(canonicalUrl(getSeoConfig(), '//news/story?preview_token=secret'), 'http://localhost:5000/news/story');
});

test('HTML escaping and safe JSON-LD serialization prevent script breakouts', () => {
  const { escapeHtml, safeJsonLd } = require('../src/seo/utils');

  assert.equal(escapeHtml('<title "bad">'), '&lt;title &quot;bad&quot;&gt;');
  assert.doesNotMatch(safeJsonLd({ name: '</script><script>alert(1)</script>' }), /<\/script>/i);
  assert.match(safeJsonLd({ name: '</script>' }), /\\u003c\/script\\u003e/);
});

test('local upload URLs become absolute and Cloudinary URLs are preserved', () => {
  const { resolveAbsoluteUrl } = require('../src/seo/utils');
  const options = {
    siteOrigin: 'https://example.org',
    assetOrigin: 'https://assets.example.org',
  };

  assert.equal(
    resolveAbsoluteUrl('/uploads/news/photo.webp', options),
    'https://assets.example.org/uploads/news/photo.webp'
  );
  assert.equal(
    resolveAbsoluteUrl('https://res.cloudinary.com/demo/image/upload/sample.webp', options),
    'https://res.cloudinary.com/demo/image/upload/sample.webp'
  );
  assert.equal(resolveAbsoluteUrl('javascript:alert(1)', { ...options, defaultUrl: 'fallback' }), 'fallback');
  assert.equal(resolveAbsoluteUrl('/admin/private.webp', { ...options, defaultUrl: 'fallback' }), 'fallback');
  assert.equal(resolveAbsoluteUrl('/uploads/tmp/private.webp', { ...options, defaultUrl: 'fallback' }), 'fallback');
});

test('homepage organization schema uses configured public URLs only', () => {
  const { getSeoConfig } = require('../src/seo/config');
  const { organizationSchema } = require('../src/seo/descriptors');

  const schema = organizationSchema(getSeoConfig());
  assert.equal(schema['@type'], 'Organization');
  assert.equal(schema.url, 'http://localhost:5000/');
  assert.doesNotMatch(JSON.stringify(schema), /onrender\.com/);
});

test('article, event, person, landmark, and breadcrumb descriptors include expected schema types', () => {
  const { contentDescriptor } = require('../src/seo/descriptors');

  const article = contentDescriptor({
    path: '/news/story',
    sectionName: 'News',
    title: 'Story',
    description: 'Story summary',
    schema: { '@type': 'NewsArticle' },
  });
  const event = contentDescriptor({
    path: '/events/durbar',
    sectionName: 'Events',
    title: 'Durbar',
    description: 'Event summary',
    schema: { '@type': 'Event', startDate: '2026-06-16T10:00:00Z' },
  });
  const person = contentDescriptor({
    path: '/hall-of-fame/person',
    sectionName: 'Hall of Fame',
    title: 'Person',
    description: 'Profile summary',
    schema: { '@type': 'Person', jobTitle: 'Leader' },
  });
  const landmark = contentDescriptor({
    path: '/landmarks/site',
    sectionName: 'Landmarks and Attractions',
    title: 'Site',
    description: 'Landmark summary',
    schema: { '@type': 'TouristAttraction' },
  });

  assert.equal(article.structuredData[0]['@type'], 'NewsArticle');
  assert.equal(event.structuredData[0]['@type'], 'Event');
  assert.equal(person.structuredData[0]['@type'], 'Person');
  assert.equal(landmark.structuredData[0]['@type'], 'TouristAttraction');
  assert.equal(article.structuredData[1]['@type'], 'BreadcrumbList');
  assert.deepEqual(article.structuredData[1].itemListElement.map((item) => item.position), [1, 2, 3]);
});

test('obituary schema is represented as a WebPage about a Person', () => {
  const { contentDescriptor } = require('../src/seo/descriptors');

  const descriptor = contentDescriptor({
    path: '/obituaries/person',
    sectionName: 'Obituaries',
    title: 'Person Name',
    description: 'Remembering Person Name.',
    schema: {
      '@type': 'WebPage',
      mainEntity: {
        '@type': 'Person',
        name: 'Person Name',
        birthDate: '1940-01-01',
        deathDate: '2026-01-01',
      },
    },
  });

  assert.equal(descriptor.structuredData[0]['@type'], 'WebPage');
  assert.equal(descriptor.structuredData[0].mainEntity['@type'], 'Person');
  assert.equal(descriptor.structuredData[0].mainEntity.name, 'Person Name');
});

test('initial crawlable content is escaped and includes important route facts', () => {
  const { contentDescriptor, injectSeoIntoHtml } = require('../src/seo/descriptors');

  const descriptor = contentDescriptor({
    path: '/news/story',
    sectionName: 'News',
    title: '<Unsafe Story>',
    description: 'Story <script>alert(1)</script> summary',
    image: '/uploads/news/photo.webp',
    imageAlt: 'Story image',
    schema: { '@type': 'NewsArticle' },
    publishedDate: '2026-06-16T00:00:00Z',
    author: 'Reporter',
  });
  const html = injectSeoIntoHtml('<html><head><title></title></head><body><div id="root"></div></body></html>', descriptor);

  assert.match(html, /data-seo-initial-content="true"/);
  assert.match(html, /id="seo-initial-content-style"/);
  assert.match(html, /#root \[data-seo-initial-content="true"\]\{display:none!important\}/);
  assert.match(html, /<noscript><style>#root \[data-seo-initial-content="true"\]\{display:block!important\}/);
  assert.match(html, /&lt;Unsafe Story&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /By Reporter/);
  assert.match(html, /Published 2026-06-16T00:00:00.000Z/);
  assert.match(html, /http:\/\/localhost:5000\/uploads\/news\/photo.webp/);
});

test('indexability rules noindex preview and unknown routes', async () => {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'agona_test';
  process.env.DB_USER = 'agona';
  process.env.DB_PASSWORD = 'agona';
  process.env.JWT_SECRET = 'test-jwt-secret-1234567890';
  process.env.PREVIEW_TOKEN_SECRET = 'test-preview-secret-1234567890';
  process.env.SEO_DISABLE_DB_LOOKUPS = 'true';
  const { resolveSeoForRoute } = require('../src/seo/routeSeoService');

  const preview = await resolveSeoForRoute('/news/story', { preview_token: 'abc' });
  const missing = await resolveSeoForRoute('/not-a-route', {});

  assert.equal(preview.robots, 'noindex,nofollow');
  assert.equal(preview.canonicalUrl, '');
  assert.equal(missing.status, 404);
  assert.equal(missing.robots, 'noindex,nofollow');
});

test('CMS about pages are not treated as always-published static SEO routes', async () => {
  process.env.SEO_DISABLE_DB_LOOKUPS = 'true';
  const { resolveSeoForRoute, staticRoutes } = require('../src/seo/routeSeoService');

  assert.equal(staticRoutes.has('/about/history'), false);
  const descriptor = await resolveSeoForRoute('/about/history', {});
  assert.equal(descriptor.robots, 'noindex,nofollow');
  assert.equal(descriptor.canonicalUrl, '');
});

test('sitemap includes eligible about pages from database rows and excludes legacy duplicates', async () => {
  const db = require('../src/config/db');
  const originalQuery = db.pool.query;
  const { buildSitemapXml } = require('../src/seo/sitemapService');

  db.pool.query = async (sql) => {
    if (/FROM about_pages/.test(sql)) {
      return { rows: [{ slug: 'history', updated_at: '2026-06-16T00:00:00Z' }] };
    }
    if (/FROM news/.test(sql)) {
      return { rows: [{ slug: 'story', updated_at: '2026-06-15T00:00:00Z' }] };
    }
    return { rows: [] };
  };

  try {
    const xml = await buildSitemapXml();
    assert.match(xml, /<loc>http:\/\/localhost:5000\/about\/history<\/loc>/);
    assert.match(xml, /<loc>http:\/\/localhost:5000\/news\/story<\/loc>/);
    assert.doesNotMatch(xml, /\/updates<\/loc>/);
    assert.doesNotMatch(xml, /\/obituary\//);
    assert.doesNotMatch(xml, /\/admin/);
  } finally {
    db.pool.query = originalQuery;
  }
});

test('robots permits public production paths and discourages indexing outside production', () => {
  const { buildRobotsTxt } = require('../src/seo/sitemapService');

  process.env.NODE_ENV = 'production';
  process.env.SITE_URL = 'https://example.org';
  process.env.PUBLIC_ASSET_BASE_URL = 'https://example.org';
  process.env.PUBLIC_SHARE_IMAGE_URL = 'https://example.org/share-default.svg';
  assert.match(buildRobotsTxt(), /Disallow: \/admin/);
  assert.match(buildRobotsTxt(), /Disallow: \/api\//);
  assert.match(buildRobotsTxt(), /Sitemap: https:\/\/example.org\/sitemap.xml/);
  assert.doesNotMatch(buildRobotsTxt(), /Disallow: \/assets/);

  process.env.NODE_ENV = 'test';
  process.env.SITE_URL = 'http://localhost:5000';
  process.env.PUBLIC_ASSET_BASE_URL = 'http://localhost:5000';
  process.env.PUBLIC_SHARE_IMAGE_URL = 'http://localhost:5000/share-default.svg';
  assert.match(buildRobotsTxt(), /Disallow: \/$/m);
});

const requestApp = async (app, path) =>
  await new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      http
        .get(
          {
            hostname: '127.0.0.1',
            port,
            path,
            headers: { Accept: 'text/html' },
          },
          (res) => {
            res.resume();
            res.on('end', () => {
              server.close(() => resolve(res));
            });
          }
        )
        .on('error', (error) => {
          server.close(() => reject(error));
        });
    });
  });

test('public canonical redirects normalize slashes and strip query strings', async () => {
  const { createApp } = require('../src/app');
  const app = createApp();

  const trailing = await requestApp(app, '/news/?utm_source=test');
  assert.equal(trailing.statusCode, 301);
  assert.equal(trailing.headers.location, '/news');

  const legacy = await requestApp(app, '/obituary/person?preview_token=secret');
  assert.equal(legacy.statusCode, 301);
  assert.equal(legacy.headers.location, '/obituaries/person');
});

test('production SEO config rejects suspended Render origins', () => {
  const { parseOrigin } = require('../src/seo/config');
  const { validateSeoEnv } = require('../src/config/env');

  assert.equal(parseOrigin('SITE_URL', 'https://example.org/'), 'https://example.org');
  process.env.NODE_ENV = 'production';
  process.env.SITE_URL = 'https://agonanyakrom.onrender.com';
  assert.throws(() => validateSeoEnv(), /suspended Render/);
});
