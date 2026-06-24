const { pool } = require('../config/db');
const { getAnalyticsConfig } = require('../config/analytics');

const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const parseDate = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error('Invalid analytics date range.');
    error.status = 400;
    throw error;
  }
  return parsed;
};

const resolveDateRange = (query = {}, config = getAnalyticsConfig()) => {
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 29 * DAY_MS);
  const startDate = parseDate(query.start_date || query.startDate, defaultStart);
  const endDate = parseDate(query.end_date || query.endDate, now);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (startDate > endDate) {
    const error = new Error('Start date must be before end date.');
    error.status = 400;
    throw error;
  }

  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS);
  if (rangeDays > config.adminMaxRangeDays) {
    const error = new Error(`Analytics reports are limited to ${config.adminMaxRangeDays} days.`);
    error.status = 400;
    throw error;
  }

  return { startDate, endDate, rangeDays };
};

const createAnalyticsEvent = async (event) => {
  const columns = [
    'occurred_at',
    'event_type',
    'anon_session_id',
    'route_path',
    'route_pattern',
    'page_title',
    'content_type',
    'content_id',
    'content_slug',
    'referrer_category',
    'device_category',
    'campaign_source',
    'campaign_medium',
    'campaign_name',
    'campaign_term',
    'campaign_content',
    'read_depth_percent',
    'search_query',
    'search_result_count',
    'search_result_position',
    'metadata',
  ];
  const values = columns.map((column) =>
    column === 'metadata' ? JSON.stringify(event[column] || {}) : event[column] ?? null
  );
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

  await pool.query(
    `INSERT INTO analytics_events (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );
};

const fetchOne = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows[0] || {};
};

const fetchRows = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows;
};

const reportParams = ({ startDate, endDate }) => [startDate.toISOString(), endDate.toISOString()];

const getAnalyticsReport = async (query = {}) => {
  const config = getAnalyticsConfig();
  const range = resolveDateRange(query, config);
  const params = reportParams(range);

  const [
    totals,
    viewsOverTime,
    topPages,
    topContent,
    contentTypes,
    searchActivity,
    zeroResultSearches,
    referrers,
    devices,
    readDepth,
    recentActivity,
  ] = await Promise.all([
    fetchOne(
      `SELECT
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE event_type = 'content_view')::int AS content_views,
        COUNT(DISTINCT anon_session_id)::int AS unique_sessions
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz`,
      params
    ),
    fetchRows(
      `SELECT date_trunc('day', occurred_at)::date AS date,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE event_type = 'content_view')::int AS content_views,
        COUNT(DISTINCT anon_session_id)::int AS unique_sessions
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
       GROUP BY 1
       ORDER BY 1`,
      params
    ),
    fetchRows(
      `SELECT route_path, COALESCE(MAX(page_title), route_path) AS page_title,
        COUNT(*)::int AS views,
        COUNT(DISTINCT anon_session_id)::int AS unique_sessions
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz AND event_type = 'page_view'
       GROUP BY route_path
       ORDER BY views DESC, route_path
       LIMIT 10`,
      params
    ),
    fetchRows(
      `SELECT content_type, content_id, content_slug, COALESCE(MAX(page_title), content_slug, content_id) AS title,
        COUNT(*)::int AS views
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
         AND event_type = 'content_view'
         AND content_type IS NOT NULL
       GROUP BY content_type, content_id, content_slug
       ORDER BY views DESC
       LIMIT 20`,
      params
    ),
    fetchRows(
      `SELECT COALESCE(content_type, 'unknown') AS content_type, COUNT(*)::int AS views
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz AND event_type = 'content_view'
       GROUP BY 1
       ORDER BY views DESC`,
      params
    ),
    fetchRows(
      `SELECT search_query, COUNT(*)::int AS searches,
        AVG(search_result_count)::numeric(10,2) AS average_result_count
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
         AND event_type IN ('search_performed', 'zero_result_search')
         AND search_query IS NOT NULL
       GROUP BY search_query
       ORDER BY searches DESC, search_query
       LIMIT 20`,
      params
    ),
    fetchRows(
      `SELECT search_query, COUNT(*)::int AS searches
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
         AND event_type = 'zero_result_search'
         AND search_query IS NOT NULL
       GROUP BY search_query
       ORDER BY searches DESC, search_query
       LIMIT 20`,
      params
    ),
    fetchRows(
      `SELECT referrer_category, COUNT(*)::int AS events
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
       GROUP BY referrer_category
       ORDER BY events DESC`,
      params
    ),
    fetchRows(
      `SELECT device_category, COUNT(*)::int AS events
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz
       GROUP BY device_category
       ORDER BY events DESC`,
      params
    ),
    fetchRows(
      `SELECT read_depth_percent, COUNT(*)::int AS events
       FROM analytics_events
       WHERE occurred_at BETWEEN $1::timestamptz AND $2::timestamptz AND event_type = 'read_depth'
       GROUP BY read_depth_percent
       ORDER BY read_depth_percent`,
      params
    ),
    fetchRows(
      `SELECT occurred_at, event_type, route_path, page_title, content_type,
        content_slug, referrer_category, device_category, read_depth_percent
       FROM analytics_events
       WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 minute')
       ORDER BY occurred_at DESC
       LIMIT 25`,
      [config.recentWindowMinutes]
    ),
  ]);

  return {
    range: {
      start_date: toIsoDate(range.startDate),
      end_date: toIsoDate(range.endDate),
      range_days: range.rangeDays,
    },
    totals,
    views_over_time: viewsOverTime,
    top_pages: topPages,
    top_content: topContent,
    content_types: contentTypes,
    search_activity: searchActivity,
    zero_result_searches: zeroResultSearches,
    referrer_categories: referrers,
    device_categories: devices,
    read_depth: readDepth,
    recent_activity: recentActivity,
    refresh_interval_seconds: Number.parseInt(
      process.env.ANALYTICS_ADMIN_REFRESH_SECONDS || '60',
      10
    ),
  };
};

const cleanupAnalyticsEvents = async ({ dryRun = true, retentionDays } = {}) => {
  const config = getAnalyticsConfig();
  const days = Number.parseInt(retentionDays || config.retentionDays, 10);
  if (!Number.isFinite(days) || days <= 0 || days > 730) {
    const error = new Error('Invalid analytics retention period.');
    error.status = 400;
    throw error;
  }

  const cutoff = new Date(Date.now() - days * DAY_MS);
  if (dryRun) {
    const result = await fetchOne(
      'SELECT COUNT(*)::int AS deleted_count FROM analytics_events WHERE occurred_at < $1',
      [cutoff.toISOString()]
    );
    return { dry_run: true, cutoff: cutoff.toISOString(), deleted_count: result.deleted_count || 0 };
  }

  const { rowCount } = await pool.query('DELETE FROM analytics_events WHERE occurred_at < $1', [
    cutoff.toISOString(),
  ]);
  return { dry_run: false, cutoff: cutoff.toISOString(), deleted_count: rowCount };
};

module.exports = {
  cleanupAnalyticsEvents,
  createAnalyticsEvent,
  getAnalyticsReport,
  resolveDateRange,
};
