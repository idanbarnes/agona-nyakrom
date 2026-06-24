# Analytics Validation Checklist

## Implemented Protections

- Event type allowlist.
- Content type, referrer category, and device category allowlists.
- Payload size limit.
- Ingestion rate limit.
- Short-window duplicate mitigation.
- Obvious bot user-agent filtering.
- Sensitive URL query stripping, preserving only UTM campaign fields.
- Sensitive search-query redaction.
- Server-side occurrence timestamp.
- Analytics feature flag.
- Protected admin report endpoints.
- Retention cleanup dry-run and execute modes.

## Manual Verification Targets

- Apply migration and rollback migration.
- Submit valid `page_view`, `content_view`, `search_performed`, `zero_result_search`, `search_result_clicked`, `share_clicked`, `related_content_clicked`, `outbound_link_clicked`, `contact_action_clicked`, and `read_depth`.
- Confirm unknown event types return `400`.
- Confirm oversized payloads return `413`.
- Confirm repeated duplicate events return accepted-but-ignored.
- Confirm excessive event rates return `429`.
- Confirm obvious bot user agents are ignored.
- Confirm `ANALYTICS_ENABLED=false` accepts without writing.
- Confirm `/api/admin/analytics/report` requires admin authentication.
- Confirm invalid date ranges return `400`.
- Confirm dashboard loads empty, loading, error, and populated states.
- Confirm cleanup dry-run reports counts and execute deletes only analytics rows.

## Not In Scope

- External analytics vendors.
- Administrator audit trails.
- WebSockets or message brokers.
- Raw IP storage.
- Browser fingerprinting.
- Exact geolocation.
