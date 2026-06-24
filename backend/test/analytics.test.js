const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'agona_test';
process.env.DB_USER = 'agona';
process.env.DB_PASSWORD = 'agona';
process.env.JWT_SECRET = 'analytics-test-secret';
process.env.PREVIEW_TOKEN_SECRET = 'analytics-preview-secret';
process.env.SEO_DISABLE_DB_LOOKUPS = 'true';

const db = require('../src/config/db');
const { createApp } = require('../src/app');
const {
  normalizePath,
  sanitizeSearchQuery,
  validateAnalyticsEvent,
} = require('../src/services/analyticsValidationService');
const { resetAnalyticsRateLimitState } = require('../src/middleware/analyticsRateLimit');
const { resolveDateRange } = require('../src/services/analyticsService');

const originalQuery = db.pool.query;

const withServer = async (app, callback) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test.beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'analytics-test-secret';
  process.env.ANALYTICS_ENABLED = 'true';
  process.env.ANALYTICS_RATE_LIMIT_MAX_EVENTS = '60';
  process.env.ANALYTICS_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.ANALYTICS_DEDUPE_WINDOW_MS = '10000';
  process.env.ANALYTICS_MAX_PAYLOAD_BYTES = '4096';
  resetAnalyticsRateLimitState();
  db.pool.query = originalQuery;
});

test.afterEach(() => {
  db.pool.query = originalQuery;
});

test('analytics validation normalizes paths and redacts sensitive search queries', () => {
  assert.equal(normalizePath('/news/story?token=secret&utm_source=mail'), '/news/story?utm_source=mail');
  assert.equal(sanitizeSearchQuery('person@example.com'), '[redacted-sensitive-query]');

  const event = validateAnalyticsEvent(
    {
      event_type: 'search_performed',
      anon_session_id: 'abc123def456ghi789',
      page_path: '/hall-of-fame?jwt=secret&utm_campaign=festival',
      utm_campaign: 'festival',
      search_query: '+233 55 555 5555',
      search_result_count: 0,
      content_type: 'hall_of_fame',
    },
    { currentOrigin: 'http://localhost:5000' }
  );

  assert.equal(event.route_path, '/hall-of-fame?utm_campaign=festival');
  assert.equal(event.search_query, '[redacted-sensitive-query]');
  assert.equal(event.campaign_name, 'festival');
});

test('analytics validation rejects unknown event types', () => {
  assert.throws(
    () =>
      validateAnalyticsEvent({
        event_type: 'mouse_moved',
        anon_session_id: 'abc123def456ghi789',
        page_path: '/',
      }),
    /Unknown analytics event type/
  );
});

test('analytics ingestion accepts a valid event and writes a sanitized row', async () => {
  const writes = [];
  db.pool.query = async (sql, params) => {
    if (/INSERT INTO analytics_events/.test(sql)) {
      writes.push(params);
      return { rowCount: 1, rows: [] };
    }
    return { rows: [] };
  };

  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        anon_session_id: 'abc123def456ghi789',
        page_path: '/news?preview_token=secret&utm_source=newsletter',
        page_title: 'News',
        device_category: 'desktop',
      }),
    });
    const json = await response.json();

    assert.equal(response.status, 202);
    assert.equal(json.success, true);
    assert.equal(writes.length, 1);
    assert.equal(writes[0][3], '/news?utm_source=newsletter');
  });
});

test('analytics ingestion rejects malformed, oversized, duplicate, and rate-limited events', async () => {
  let writes = 0;
  db.pool.query = async (sql) => {
    if (/INSERT INTO analytics_events/.test(sql)) writes += 1;
    return { rows: [] };
  };

  await withServer(createApp(), async (baseUrl) => {
    const basePayload = {
      event_type: 'read_depth',
      anon_session_id: 'abc123def456ghi789',
      page_path: '/news/story',
      read_depth_percent: 50,
    };

    let response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...basePayload, read_depth_percent: 40 }),
    });
    assert.equal(response.status, 400);

    process.env.ANALYTICS_MAX_PAYLOAD_BYTES = '32';
    response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
    });
    assert.equal(response.status, 413);

    process.env.ANALYTICS_MAX_PAYLOAD_BYTES = '4096';
    response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
    });
    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
    });
    assert.equal(response.status, 202);
    assert.equal(writes, 1);
  });

  resetAnalyticsRateLimitState();
  process.env.ANALYTICS_RATE_LIMIT_MAX_EVENTS = '1';
  await withServer(createApp(), async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        anon_session_id: 'rate123def456ghi789',
        page_path: '/',
      }),
    });
    const second = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        anon_session_id: 'rate123def456ghi790',
        page_path: '/news',
      }),
    });
    assert.equal(first.status, 202);
    assert.equal(second.status, 429);
  });
});

test('analytics disabled mode and obvious bots do not write events', async () => {
  let writes = 0;
  db.pool.query = async (sql) => {
    if (/INSERT INTO analytics_events/.test(sql)) writes += 1;
    return { rows: [] };
  };

  process.env.ANALYTICS_ENABLED = 'false';
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        anon_session_id: 'abc123def456ghi789',
        page_path: '/',
      }),
    });
    assert.equal(response.status, 202);
  });

  process.env.ANALYTICS_ENABLED = 'true';
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Googlebot' },
      body: JSON.stringify({
        event_type: 'page_view',
        anon_session_id: 'abc123def456ghi790',
        page_path: '/',
      }),
    });
    assert.equal(response.status, 202);
  });

  assert.equal(writes, 0);
});

test('admin analytics requires auth and validates date ranges', async () => {
  db.pool.query = async (sql, params) => {
    if (/FROM admins/.test(sql)) {
      return { rows: [{ id: params[0], email: 'admin@example.com', name: 'Admin', role: 'admin' }] };
    }
    return { rows: [] };
  };

  const token = jwt.sign({ id: 'admin-id' }, process.env.JWT_SECRET);
  await withServer(createApp(), async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/api/admin/analytics/report`);
    assert.equal(unauthorized.status, 401);

    const invalid = await fetch(
      `${baseUrl}/api/admin/analytics/report?start_date=2026-06-16&end_date=2026-01-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert.equal(invalid.status, 400);
  });
});

test('analytics date range and aggregate report shape are calculated from database rows', async () => {
  assert.throws(
    () => resolveDateRange({ start_date: '2026-01-01', end_date: '2027-01-01' }, { adminMaxRangeDays: 30 }),
    /limited to 30 days/
  );

  const { getAnalyticsReport } = require('../src/services/analyticsService');
  db.pool.query = async (sql) => {
    if (/COUNT\(\*\)::int AS total_events/.test(sql)) {
      return { rows: [{ total_events: 4, page_views: 2, content_views: 1, unique_sessions: 2 }] };
    }
    if (/date_trunc/.test(sql)) {
      return { rows: [{ date: '2026-06-16', page_views: 2, content_views: 1, unique_sessions: 2 }] };
    }
    return { rows: [] };
  };

  const report = await getAnalyticsReport({
    start_date: '2026-06-01',
    end_date: '2026-06-16',
  });
  assert.equal(report.totals.page_views, 2);
  assert.equal(report.views_over_time[0].unique_sessions, 2);
});

test('analytics migration creates and rolls back the analytics_events table', async () => {
  const migration = require('../migrations/20260616000001_create_analytics_events');
  const calls = [];
  const knex = {
    fn: { now: () => 'now()' },
    raw: (value) => value,
    schema: {
      createTable: async (name, callback) => {
        calls.push(['createTable', name]);
        const chain = {
          primary: () => chain,
          notNullable: () => chain,
          nullable: () => chain,
          defaultTo: () => chain,
          index: () => chain,
        };
        const table = new Proxy(
          {
            index: (columns) => calls.push(['index', columns]),
          },
          {
            get(target, prop) {
              if (prop in target) return target[prop];
              return () => chain;
            },
          }
        );
        callback(table);
      },
      dropTableIfExists: async (name) => calls.push(['dropTableIfExists', name]),
    },
  };

  await migration.up(knex);
  await migration.down(knex);

  assert.deepEqual(calls[0], ['createTable', 'analytics_events']);
  assert.ok(calls.some((call) => call[0] === 'index' && call[1][0] === 'event_type'));
  assert.deepEqual(calls.at(-1), ['dropTableIfExists', 'analytics_events']);
});
