# Analytics Architecture

## Summary

The platform now uses first-party visitor analytics only. No external analytics vendor, audit trail, administrator activity logging, raw IP storage, browser fingerprinting, exact geolocation, cookies, JWTs, or user IDs are collected.

Public events are submitted to `POST /api/analytics/events`. Admin reports are served from protected endpoints under `/api/admin/analytics`.

## Data Flow

1. `public-frontend/src/components/AnalyticsRouteTracker.jsx` tracks route changes, read depth, and approved link clicks.
2. `public-frontend/src/lib/analytics.js` creates a random anonymous session ID in `sessionStorage`, prepares allowlisted event payloads, and sends them with `navigator.sendBeacon` or a non-blocking fetch fallback.
3. `backend/src/controllers/analyticsController.js` checks feature enablement, payload size, bot user agents, rate limits, duplicate events, and validation.
4. `backend/src/services/analyticsValidationService.js` normalizes routes, strips sensitive query parameters, classifies referrers, allowlists campaign parameters, and redacts sensitive search text.
5. `backend/src/services/analyticsService.js` writes validated rows to `analytics_events` and serves aggregate admin reports.
6. `admin-frontend/src/pages/analytics/AdminAnalyticsPage.jsx` displays aggregate anonymous reporting.

## Database

Migration: `backend/migrations/20260616000001_create_analytics_events.js`.

Table: `analytics_events`.

Indexed fields support dashboard queries by timestamp, event type, anonymous session, route path, content type/content ID, referrer category, and device category.

Expected growth depends on traffic. A typical row stores short strings plus a tiny JSON metadata object. At 10,000 events/day, raw storage is expected to remain in the low GB range over a 180-day retention window before PostgreSQL index overhead and vacuum behavior.

## API

Public:

- `POST /api/analytics/events`

Admin:

- `GET /api/admin/analytics/report?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `POST /api/admin/analytics/cleanup?dry_run=true&retention_days=180`

Admin endpoints require the existing `requireAdminAuth` middleware.

## Near Real Time

The admin dashboard polls periodically. Default refresh is `ANALYTICS_ADMIN_REFRESH_SECONDS=60`.

## Configuration

- `ANALYTICS_ENABLED`
- `ANALYTICS_RETENTION_DAYS`
- `ANALYTICS_MAX_PAYLOAD_BYTES`
- `ANALYTICS_RATE_LIMIT_WINDOW_MS`
- `ANALYTICS_RATE_LIMIT_MAX_EVENTS`
- `ANALYTICS_DEDUPE_WINDOW_MS`
- `ANALYTICS_ADMIN_MAX_RANGE_DAYS`
- `ANALYTICS_RECENT_WINDOW_MINUTES`
- `ANALYTICS_ADMIN_REFRESH_SECONDS`
- `VITE_ANALYTICS_ENABLED`

Development tracking is disabled unless explicitly enabled.
