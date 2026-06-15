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

Local development commands remain unchanged:

- public frontend: `npm --prefix public-frontend run dev`
- admin frontend: `npm --prefix admin-frontend run dev`
- backend API: `npm --prefix backend run dev`

Unified production-style local commands:

- install workspace dependencies: `npm run install:workspaces`
- unified build: `npm run build:unified`
- unified production start: `npm run start:unified`
- install, build, and start in one command: `npm run unified`

## Build Outputs

The unified build copies generated frontend artifacts into backend-served runtime directories:

- public build source: `public-frontend/dist`
- admin build source: `admin-frontend/dist`
- unified public runtime output: `backend/dist/public`
- unified admin runtime output: `backend/dist/admin`

Generated build artifacts stay outside the frontend source trees.

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

Vite development still works through the existing proxy arrangement:

- public Vite proxies `/api` and `/uploads`
- admin Vite proxies `/api` and `/uploads`

## Admin Base Path

The admin unified build is produced with `VITE_APP_BASE_PATH=/admin/`.

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
- frontend lint currently fails on pre-existing React hook lint rules outside this change set.
- no repository type-check script currently exists.
- browser-based smoke flows in the requested checklist were documented, not fully executed here.
- local unified start still depends on a working local database and backend environment.

## Rollback

To roll back this phase locally:

1. stop the unified runtime
2. return to separate local processes with the existing per-app dev commands
3. ignore `backend/dist/public` and `backend/dist/admin` outputs or rebuild them later
4. if needed, revert the root orchestration scripts and backend static-serving changes

No database migration is involved in rollback.
