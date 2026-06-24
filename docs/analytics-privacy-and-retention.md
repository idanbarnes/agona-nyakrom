# Analytics Privacy And Retention

## Anonymous Session Policy

The public frontend stores a random anonymous identifier in `sessionStorage` under `agona_analytics_session`. It is not derived from IP address, user agent, screen size, browser fingerprinting, login state, JWTs, or user IDs.

The identifier uses a rolling 30-minute expiry and is scoped to the browser session. It does not support cross-device tracking and is cleared by normal browser session-storage behavior.

## Search Sanitization

Search text is trimmed and capped at 96 characters. Queries are redacted to `[redacted-sensitive-query]` when they appear to contain:

- email addresses;
- telephone-number-like values;
- token-like long identifiers;
- sensitive words such as password, secret, token, JWT, authorization, bearer, SSN, or passport.

## Referrers And Campaigns

Referrers are classified as `direct`, `internal`, `search`, `social`, `referral`, or `campaign`. Complete referrer URLs are not stored.

Campaign collection is limited to standard UTM fields: source, medium, campaign, term, and content.

## Retention

Recommended default raw-event retention is 180 days: `ANALYTICS_RETENTION_DAYS=180`.

Cleanup command:

```powershell
npm --prefix backend run analytics:cleanup
```

The command defaults to dry-run. To delete old analytics rows:

```powershell
npm --prefix backend run analytics:cleanup -- --execute
```

The cleanup deletes only rows from `analytics_events`, reports deleted counts, and is idempotent.

## Known Limitations

Bot detection is lightweight and based on obvious user-agent patterns plus event-rate controls. It is not perfect.

Unique sessions are approximate because the platform intentionally avoids durable cross-device identifiers.

Long-term aggregate tables are not added yet. If traffic grows, daily aggregates can be introduced before reducing raw-event retention further.
