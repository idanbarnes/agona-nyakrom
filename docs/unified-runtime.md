# Unified Runtime

## Scope

This document covers the local Phase 1 unified runtime only.

It does not change:

- Render services
- production domains or DNS
- production environment variables already in use
- database schema
- JWT bearer authentication
- existing compatibility API aliases

## Outcome

One local Express runtime now serves:

- public frontend from `/`
- admin frontend from `/admin`
- backend API from `/api`
- local media from `/uploads`

The existing source trees remain separate:

- `public-frontend`
- `admin-frontend`
- `backend`

## Commands

Package-level development commands remain unchanged:

- public frontend: `npm --prefix public-frontend run dev`
- admin frontend: `npm --prefix admin-frontend run dev`
- backend API: `npm --prefix backend run dev`

Unified local development command:

- root unified dev: `npm run dev`
- alias: `npm run dev:unified`

The root command starts all three existing package-level development processes concurrently and stops them together on termination.

Unified production-style local commands:

- install workspace dependencies: `npm run install:workspaces`
- unified build: `npm run build:unified`
- unified production start: `npm run start:unified`
- install, build, and start in one command: `npm run unified`

Expected terminal behavior for `npm run start:unified`:

- Knex runs pending migrations first
- the backend connects to the database
- the server logs `Server is running on http://localhost:5000`
- the terminal stays occupied until you stop the process manually

To stop the unified production server locally:

- press `Ctrl+C`
- the runtime handles `SIGINT`/`SIGTERM`, closes the HTTP listener, and then exits cleanly

## Build Outputs

The unified build copies generated frontend artifacts into backend-served runtime directories:

- public build source: `public-frontend/dist`
- admin build source: `admin-frontend/dist`
- unified public runtime output: `backend/dist/public`
- unified admin runtime output: `backend/dist/admin`

Generated build artifacts stay outside the frontend source trees.

Required generated files after `npm run build:unified`:

- `backend/dist/public/index.html`
- `backend/dist/public/assets/...`
- `backend/dist/admin/index.html`
- `backend/dist/admin/assets/...`

## API Base Behavior

Public frontend:

- centralized in `public-frontend/src/lib/apiBase.js`
- development defaults to `http://localhost:5000`
- production supports relative same-origin `/api` requests when `VITE_API_BASE_URL` is unset

Admin frontend:

- centralized in `admin-frontend/src/lib/apiBase.js`
- shared request helpers now resolve API URLs from one place
- development defaults to `http://localhost:5000`
- production supports relative same-origin `/api` requests when `VITE_API_BASE_URL` is unset
- production builds default to `/admin/` as the Vite base path

Vite development still works through the existing proxy arrangement:

- public Vite proxies `/api` and `/uploads`
- admin Vite proxies `/api` and `/uploads`
- no frontend development override is required when using the root unified dev command because both frontends already default to the local backend API origin in development

## Admin Base Path

The admin production build defaults to `/admin/` and the unified build keeps the same base path.

That makes built admin assets resolve from `/admin/assets/...` while keeping the existing admin source tree and route structure intact.

Admin route behavior now assumes:

- login route: `/admin/login`
- dashboard route: `/admin/dashboard`
- CMS routes remain under `/admin/...`

Compatibility redirects remain in the admin SPA for legacy root-level `/login` and `/dashboard`.

## Route Precedence

The unified Express runtime is ordered as follows:

1. `GET /api/health`
2. `/uploads` static media
3. all `/api/...` route groups, including compatibility aliases
4. unknown `/api/*` JSON 404 handler
5. server-side public meta handlers for `/events/:slug` and `/announcements/:slug`
6. admin static assets under `/admin`
7. admin SPA fallback for `/admin` and `/admin/*`
8. public static assets and prerendered public files from `backend/dist/public`
9. public SPA fallback for non-file, non-`/api`, non-`/admin`, non-`/uploads` requests
10. error middleware

Implications:

- unknown API routes return JSON, never public HTML
- `/uploads/*` is never handled by an SPA fallback
- `/admin/*` never falls through to the public SPA
- public SPA fallback is last among HTML route handlers

## Health Endpoint

The runtime preserves `GET /api/health`.

Current response:

- `{ "status": "ok", "message": "Backend running" }`

It is unauthenticated and does not expose secrets or config values.

## Environment Variables

Existing backend variables remain valid.

New transitional variable:

- `UNIFIED_SITE_URL`

Usage:

- when set, preview/public URL generation can target the future unified origin
- when unset, existing `PUBLIC_SITE_URL` and `ADMIN_SITE_URL` behavior remains

Variables used by unified local runtime:

- backend: `PORT`, `DATABASE_URL` or `DB_*`, `JWT_SECRET`, `PREVIEW_TOKEN_SECRET`, `UPLOAD_DIR`
- backend origins: `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`, `UNIFIED_SITE_URL`, `PUBLIC_ASSET_BASE_URL`, `CORS_ALLOWED_ORIGINS`
- public frontend optional: `VITE_API_BASE_URL`, `VITE_PUBLIC_SITE_URL`
- admin frontend optional: `VITE_API_BASE_URL`, `VITE_PUBLIC_SITE_URL`

Recommended local values for the root unified dev command:

- public URL: `PUBLIC_SITE_URL=http://localhost:5174`
- admin URL: `ADMIN_SITE_URL=http://localhost:5173`
- API asset base: `PUBLIC_ASSET_BASE_URL=http://localhost:5000`

Required environment variables:

- backend: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- backend: `JWT_SECRET`
- backend: `PREVIEW_TOKEN_SECRET` recommended

Optional environment variables:

- backend: `PORT` defaults to `5000`
- backend: `UPLOAD_DIR`
- backend: `CORS_ALLOWED_ORIGINS`
- backend: `UNIFIED_SITE_URL`
- public frontend: `VITE_API_BASE_URL`
- public frontend: `VITE_PUBLIC_SITE_URL`
- admin frontend: `VITE_API_BASE_URL`
- admin frontend: `VITE_PUBLIC_SITE_URL`

Local development URLs used by the repository:

- public site: `http://localhost:5174`
- admin site: `http://localhost:5173`
- API and uploads origin: `http://localhost:5000`

Unified local production-style URLs after `npm run start:unified`:

- public site: `http://localhost:5000/`
- admin site: `http://localhost:5000/admin`
- health check: `http://localhost:5000/api/health`

To run the unified runtime on another port in Windows PowerShell:

- `$env:PORT=5001`
- `npm run start:unified`
- `Remove-Item Env:PORT`

## CORS Transition Notes

Current multi-origin support is preserved.

`UNIFIED_SITE_URL` allows adding the future single origin without removing current origins yet.

CORS entries that should become obsolete only after unified deployment is live and verified:

- separate public-site origin entries
- separate admin-site origin entries

At that point, `CORS_ALLOWED_ORIGINS` can be reduced to the unified origin plus any intentional external callers.

## Uploads And Media

`/uploads` continues to serve local filesystem media through Express.

Unchanged behavior:

- existing local `/uploads/...` URLs remain valid in local unified runtime
- existing Cloudinary absolute URLs remain unchanged
- SPA fallbacks do not intercept `/uploads/*`

Known uncertainty:

- repository warnings indicate some published content may still reference legacy local upload paths
- production may still depend on local-path records even though hosted Cloudinary usage is preferred

This phase does not migrate or delete media.

## Preview Behavior

Preview-token flow is preserved:

- admin preview requests still go through `/api/admin/:resource/:id/preview`
- preview target URLs still carry `preview_token`
- public preview routes remain public-route requests, not admin routes

When `UNIFIED_SITE_URL` is set, preview URL generation can target the unified origin without removing current origin variables.

## Unchanged Legacy Compatibility

This phase intentionally keeps:

- legacy admin/public API aliases
- `/api/v1/contact` and `/api/v1/faqs`
- `/api/admin/asafo` and `/api/admin/asafo-companies`
- public `/api/public/asafo` and `/api/public/asafo-companies`
- server-side event and announcement meta handling
- JWT bearer auth with `localStorage`

## Known Limitations

- `npm run build:unified` starts the backend locally because the public prerender script fetches live API data.
- `npm --prefix public-frontend run build` also needs the backend API running locally for the prerender step.
- no repository type-check script currently exists.
- browser-based smoke flows in the requested checklist were documented, not fully executed here.
- local unified start still depends on a working local database and backend environment.

## Troubleshooting

- If `npm run start:unified` fails before listening, verify the required backend environment variables are set: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus `JWT_SECRET`.
- If startup fails with `Port 5000 is already in use.`, another local process is already bound to that port.
- To identify the process in Windows PowerShell, run `netstat -ano | findstr :5000`.
- To stop a known process after confirming what it is, run `taskkill /PID <PID> /F`.
- Do not kill a process until you have confirmed it is the correct one.
- To retry on another port in Windows PowerShell, run `$env:PORT=5001`, then `npm run start:unified`, then `Remove-Item Env:PORT` when finished.
- If startup reports missing unified build output, rerun `npm run build:unified` from the repository root and confirm `backend/dist/public/index.html` and `backend/dist/admin/index.html` exist.
- If `http://localhost:5000/` or `http://localhost:5000/admin` renders a blank shell, check that the matching `assets` directories exist under `backend/dist/public/assets` and `backend/dist/admin/assets`.
- If `/uploads/...` does not resolve, confirm `UPLOAD_DIR` points to the expected local uploads directory or leave it unset to use `backend/uploads`.

## Rollback

To roll back this phase locally:

1. stop the unified runtime
2. return to separate local processes with the existing per-app dev commands
3. ignore `backend/dist/public` and `backend/dist/admin` outputs or rebuild them later
4. if needed, revert the root orchestration scripts and backend static-serving changes

No database migration is involved in rollback.
