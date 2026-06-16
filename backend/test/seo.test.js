const test = require('node:test');
const assert = require('node:assert/strict');

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

test('production SEO config rejects suspended Render origins', () => {
  const { parseOrigin } = require('../src/seo/config');
  const { validateSeoEnv } = require('../src/config/env');

  assert.equal(parseOrigin('SITE_URL', 'https://example.org/'), 'https://example.org');
  process.env.NODE_ENV = 'production';
  process.env.SITE_URL = 'https://agonanyakrom.onrender.com';
  assert.throws(() => validateSeoEnv(), /suspended Render/);
});
