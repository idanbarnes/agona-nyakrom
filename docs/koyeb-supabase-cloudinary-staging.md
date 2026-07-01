# Koyeb + Supabase + Cloudinary Staging

This runbook prepares the unified Agona Nyakrom runtime for free staging:

- `/` serves the public frontend.
- `/admin` serves the admin frontend.
- `/api` serves the Express API.
- `/uploads` remains available for legacy local-upload references.
- new hosted media uploads use Cloudinary.

Do not put real secrets in this file or in committed env examples.

## Verified Commands

Use these commands for the Koyeb web service:

```bash
npm run build:unified
npm run start:unified
```

`npm run build:unified` builds both Vite apps and copies them into `backend/dist`.
`npm run start:unified` runs `backend`'s production start script, which runs migrations and starts `node server.js`.

## Koyeb Service Setup

Create one Koyeb Web Service from this repository.

- Service type: Web Service
- Runtime: Node.js
- Build command: `npm run build:unified`
- Run command: `npm run start:unified`
- Health check path: `/api/health`
- Port: let Koyeb inject `PORT`
- DNS: do not configure DNS for staging unless that is a separate approved task

The server reads `process.env.PORT`, validates it, and listens on `0.0.0.0`, so Koyeb can provide the runtime port. The local default remains `5000` only when `PORT` is unset.

## Required Environment Variables

Set these in Koyeb, not in committed files. Use [.env.staging.example](/C:/agona-nyakrom/.env.staging.example) as the placeholder template.

```env
NODE_ENV=production
PORT=<injected by Koyeb>
HOST=0.0.0.0
TRUST_PROXY=true
DATABASE_URL=<Supabase PostgreSQL connection string>
DB_SSL=true
JWT_SECRET=<long random secret>
PREVIEW_TOKEN_SECRET=<long random secret, or omit to use JWT_SECRET>
JWT_EXPIRES_IN=1d
ADMIN_BOOTSTRAP_TOKEN=<one-time bootstrap token>
ALLOW_ADMIN_BOOTSTRAP_WHEN_ADMINS_EXIST=false
ADMIN_PASSWORD_MIN_LENGTH=10
SITE_URL=https://<koyeb-app-url>
PUBLIC_SITE_URL=https://<koyeb-app-url>
ADMIN_SITE_URL=https://<koyeb-app-url>
UNIFIED_SITE_URL=https://<koyeb-app-url>
PUBLIC_ASSET_BASE_URL=https://<koyeb-app-url>
PUBLIC_SHARE_IMAGE_URL=https://<koyeb-app-url>/share-default.svg
PUBLIC_LOGO_URL=
PUBLIC_SOCIAL_PROFILES=
CORS_ALLOWED_ORIGINS=https://<koyeb-app-url>
MEDIA_STORAGE=cloudinary
ALLOW_PRODUCTION_LOCAL_UPLOADS=false
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BASE_FOLDER=agonanyakrom-staging
ANALYTICS_ENABLED=false
ANALYTICS_RETENTION_DAYS=180
ANALYTICS_MAX_PAYLOAD_BYTES=4096
ANALYTICS_RATE_LIMIT_WINDOW_MS=60000
ANALYTICS_RATE_LIMIT_MAX_EVENTS=60
ANALYTICS_DEDUPE_WINDOW_MS=10000
ANALYTICS_ADMIN_MAX_RANGE_DAYS=180
ANALYTICS_RECENT_WINDOW_MINUTES=30
ANALYTICS_ADMIN_REFRESH_SECONDS=60
VITE_ANALYTICS_ENABLED=false
VITE_PUBLIC_SITE_URL=https://<koyeb-app-url>
```

Notes:

- `VITE_API_BASE_URL` is intentionally forced to `/api` by the unified build script.
- `VITE_APP_BASE_PATH` is intentionally forced to `/admin/` by the unified build script.
- Keep `ALLOW_PRODUCTION_LOCAL_UPLOADS=false` for hosted staging.
- Do not use suspended Render service URLs for `SITE_URL`, `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`, `UNIFIED_SITE_URL`, `PUBLIC_ASSET_BASE_URL`, `PUBLIC_SHARE_IMAGE_URL`, or `CORS_ALLOWED_ORIGINS`.

## Supabase Database

Create a Supabase Free project and copy its PostgreSQL connection string into `DATABASE_URL`.

Use:

```env
DB_SSL=true
```

The backend and Knex share `buildDatabaseConnectionConfig()`, which supports `DATABASE_URL` and adds `{ rejectUnauthorized: false }` when `DB_SSL=true`. That is compatible with hosted PostgreSQL providers that require TLS, including Supabase.

### Running Migrations

The Koyeb start command runs:

```bash
npm --prefix backend run migrate
node backend/server.js
```

through `npm run start:unified`. This applies Knex migrations to the Supabase database during service startup.

To run migrations manually before or after a deploy from a local machine or a Koyeb console, set the same `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `SITE_URL`, and media env values, then run:

```bash
npm --prefix backend run migrate
```

Inspect migrations before applying them to staging. Do not run destructive or data-movement scripts without a separate approval.

## Cloudinary

Create a Cloudinary account and add these Koyeb variables:

```env
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BASE_FOLDER=agonanyakrom-staging
```

Hosted staging must use Cloudinary. In production-like runtime, the backend rejects local uploads unless `ALLOW_PRODUCTION_LOCAL_UPLOADS=true`, which should remain unset or `false` for Koyeb staging.

Legacy `/uploads` paths are still served for compatibility, but Koyeb filesystem storage is not persistent and must not be treated as staging media storage.

## SITE_URL Before Final Domain

Before a final domain exists, set `SITE_URL`, `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`, `UNIFIED_SITE_URL`, and `PUBLIC_ASSET_BASE_URL` to the HTTPS Koyeb app URL.

This keeps canonical URLs, sitemap entries, robots output, share metadata, preview redirects, CORS, and asset URL resolution aligned with the unified staging origin. Replace these values later when the final domain is approved and configured.

## Analytics

Staging can run with analytics disabled:

```env
ANALYTICS_ENABLED=false
VITE_ANALYTICS_ENABLED=false
```

If staging analytics testing is required after migrations are applied, set both to `true`, generate a small amount of test traffic, verify the protected admin analytics dashboard, then decide whether to disable analytics again to avoid mixing test traffic with useful staging checks.

## SEO Limitations

Before the final domain exists:

- canonical URLs and sitemap URLs will point to the temporary Koyeb app URL;
- Search Console verification and sitemap submission should wait;
- Rich Results checks against the final domain should wait;
- staging should not use suspended Render URLs;
- admin routes remain `noindex,nofollow`.

## Health Check

Use:

```text
/api/health
```

Expected response:

```json
{ "status": "ok", "message": "Backend running" }
```

## Smoke-Test Checklist

- Deploy app to Koyeb.
- Confirm database migrations have run against Supabase.
- Verify `https://<koyeb-app-url>/api/health`.
- Verify `https://<koyeb-app-url>/`.
- Verify `https://<koyeb-app-url>/admin`.
- Create or log in as an admin.
- Upload an image and confirm the stored URL resolves through Cloudinary.
- Create a real announcement.
- Create a real event.
- Verify `https://<koyeb-app-url>/sitemap.xml`.
- Verify `https://<koyeb-app-url>/robots.txt`.
- Verify analytics ingestion if analytics is enabled.
- Verify the protected admin analytics dashboard if analytics is enabled.
- Search rendered HTML, env settings, and admin/public network calls for suspended Render URLs.

## Rollback Strategy

- Keep the last known-good Koyeb deployment available and roll back to it from Koyeb if the new deploy fails.
- If migration failure prevents startup, fix the env or migration issue and redeploy; do not edit Supabase data manually unless a separate data-recovery plan is approved.
- If a bad content change is made through the CMS, revert the content through the admin UI or restore from a Supabase backup/export if needed.
- If media uploads fail, verify Cloudinary credentials and `MEDIA_STORAGE=cloudinary`; do not switch hosted staging to local uploads as a workaround.
- If SEO URLs are wrong, correct `SITE_URL` and related origin variables, rebuild, and redeploy.

## Compatibility Findings

- Port handling: `backend/src/app.js` uses `process.env.PORT`, validates the range, defaults to `5000` only when unset, and listens on `0.0.0.0`.
- Supabase: `backend/src/config/env.js`, `backend/src/config/db.js`, and `backend/knexfile.js` use environment-only PostgreSQL config. `DATABASE_URL` plus `DB_SSL=true` enables hosted PostgreSQL SSL.
- Cloudinary: `MEDIA_STORAGE=cloudinary` requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Production-like local upload fallback is rejected unless explicitly overridden.
- Unified routing: `backend/src/app.js` preserves `/`, `/admin`, `/api`, and `/uploads`.
