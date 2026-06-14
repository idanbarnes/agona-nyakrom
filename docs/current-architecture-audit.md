# Current Architecture Audit

## Repository Structure

- `public-frontend`: React 19 + Vite + Tailwind public SPA.
- `admin-frontend`: React 19 + Vite + Tailwind admin SPA.
- `backend`: Node.js + Express 5 API with PostgreSQL and Knex migrations.
- `scripts/frontends-smoke.mjs`: browser-driven smoke tests for public and admin flows.
- `docs`: deployment, bootstrap, and migration notes.

## Current Deployment Topology

The repository is deployed as separate applications today.

- Public frontend:
  - current URL: `https://agonanyakrom.onrender.com`
  - configured in `render.yaml`
- Admin frontend:
  - current URL: `https://agonanyakrom-admin.onrender.com`
  - referenced in docs and backend env examples
- Backend API:
  - current URL: `https://agonanyakrom-api.onrender.com`
  - referenced in frontend env examples and deployment docs

`render.yaml` currently provisions only the two static frontends. Backend deployment is documented separately in `backend/README.md` and `docs/free-hosting-checklist.md`.

## Public Frontend

- Framework:
  - React 19
  - React Router
  - Vite
  - Tailwind CSS
  - Framer Motion
- Routing:
  - browser-side SPA routing in `public-frontend/src/App.jsx`
  - lazy route definitions in `public-frontend/src/routes/routeLoaders.js`
- Data access:
  - direct API fetches to backend via `VITE_API_BASE_URL`
  - public endpoint helpers in `public-frontend/src/api/endpoints.js`
- Rendering model:
  - client-rendered SPA
  - static build-time meta prerender for selected detail routes via `scripts/prerender-social-meta.mjs`
  - server-rendered meta injection for event and announcement detail routes in Express

## Admin Frontend

- Framework:
  - React 19
  - React Router
  - Vite
  - Tailwind CSS
- Routing:
  - browser-side SPA routing in `admin-frontend/src/App.jsx`
  - lazy route definitions in `admin-frontend/src/routes/routeLoaders.js`
- Authentication UX:
  - protected routes via `ProtectedRoute`
  - session state in `AdminSessionContext`
  - token and admin payload stored in `localStorage`
- Data access:
  - API client in `admin-frontend/src/lib/apiClient.js`
  - bearer token attached on each admin request

## Backend

- Framework:
  - Express 5
  - `pg` connection pool
  - Knex migrations
- Responsibilities:
  - public content APIs
  - admin APIs
  - admin authentication
  - preview token issuance and validation
  - media upload processing
  - static `/uploads` serving
  - limited server-side social meta injection
- Route structure:
  - legacy public endpoints under `/api/...`
  - current public endpoints under `/api/public/...`
  - admin endpoints under `/api/admin/...`
  - versioned contact aliases under `/api/v1/...`

## Database and ORM Layer

- Database:
  - PostgreSQL
- Connection:
  - `pg` pool with retry-once behavior for read-only transient failures
- ORM/query layer:
  - no full ORM
  - mixed raw SQL services and lightweight model wrappers
  - schema managed by Knex migrations

## Schema Inventory

Core live tables observed:

- `admins`
- `news`
- `obituaries`
- `family_clans`
- `clan_leaders`
- `asafo_companies`
- `landmarks`
- `hall_of_fame`
- `carousel_slides`
- `homepage_sections`
- `homepage_blocks`
- `global_settings`
- `history_page`
- `about_pages`
- `leaders`
- `events`
- `announcements`
- `contact_info`
- `contact_faqs`

Legacy or low-confidence tables still present in schema history:

- `history`
- `past_leaders`
- `carousel_items`
- `homepage_settings`
- `contact_submissions`

## Authentication and Authorization

- Auth mechanism:
  - JWT bearer tokens
- Token transport:
  - `Authorization: Bearer ...`
- Admin client storage:
  - token in `localStorage`
  - admin profile in `localStorage`
- Backend auth middleware:
  - `requireAdminAuth`
  - `optionalAdminAuth`
- Roles:
  - `admin`
  - `master_admin`
- Fine-grained permissions:
  - not implemented
  - only `master_admin` gate observed is admin-user management

Implication for monolith migration:

- There is no current cookie/session model to preserve.
- A same-domain move is an opportunity to convert to `HttpOnly` cookies, but that would be a behavior change and must be phased.

## Media and File Storage

- Upload middleware:
  - Multer disk storage into `backend/uploads/tmp`
- Processing:
  - Sharp-based image variant generation
  - special carousel crop workflow
- Current storage modes:
  - `local`
  - `cloudinary`
- Hosted expectation:
  - Render-hosted uploads are expected to use `MEDIA_STORAGE=cloudinary` unless explicitly overridden
- Delivery:
  - local URLs under `/uploads/...`
  - Cloudinary references can be normalized to delivery URLs

## External Integrations

Confirmed:

- Render
- Neon Postgres
- Cloudinary

Not confirmed:

- analytics vendor
- monitoring vendor
- email service
- background job service
- CDN beyond hosting defaults

## Background Jobs and Async Processing

There is no separate job runner or queue system in the repository.

Observed async or offline tasks:

- build-time social meta prerender script
- one-time database migration script to Neon
- one-time uploads migration script to Cloudinary
- admin bootstrap and admin creation scripts

## Environment Variables

Backend runtime variables observed:

- server/runtime:
  - `PORT`
  - `NODE_ENV`
  - `TRUST_PROXY`
- database:
  - `DATABASE_URL`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `DB_SSL`
- auth/security:
  - `JWT_SECRET`
  - `PREVIEW_TOKEN_SECRET`
  - `JWT_EXPIRES_IN`
  - `ADMIN_BOOTSTRAP_TOKEN`
  - `ALLOW_ADMIN_BOOTSTRAP_WHEN_ADMINS_EXIST`
  - `ADMIN_PASSWORD_MIN_LENGTH`
  - `ADMIN_PREVIEW_TOKEN_TTL_SECONDS`
  - `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS`
  - `ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS`
- origins and SEO:
  - `PUBLIC_SITE_URL`
  - `ADMIN_SITE_URL`
  - `PUBLIC_ASSET_BASE_URL`
  - `PUBLIC_SHARE_IMAGE_URL`
  - `CORS_ALLOWED_ORIGINS`
- uploads/storage:
  - `MEDIA_STORAGE`
  - `UPLOAD_DIR`
  - `MAX_FILE_SIZE_MB`
  - `ALLOW_RENDER_LOCAL_UPLOADS`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_BASE_FOLDER`

Public frontend variables observed:

- `VITE_API_BASE_URL`
- `VITE_PUBLIC_SITE_URL`

Admin frontend variables observed:

- `VITE_API_BASE_URL`
- `VITE_PUBLIC_SITE_URL`

## Build and Start Scripts

Public frontend:

- `npm run dev`
- `npm run build`
- `npm run build:render`
- `npm run lint`
- `npm run preview`
- `npm run smoke:e2e`

Admin frontend:

- `npm run dev`
- `npm run build`
- `npm run build:render`
- `npm run lint`
- `npm run preview`
- `npm run smoke:e2e`

Backend:

- `npm run dev`
- `npm run start`
- `npm run start:prod`
- `npm run start:render`
- `npm run migrate`
- `npm run admin:create`
- `npm run seed:admin`
- `npm run migrate:local-to-neon`
- `npm run migrate:uploads-to-cloudinary`

## Testing Setup

Observed automated coverage:

- linting in both frontends
- build verification in both frontends
- browser smoke script for:
  - public route loading and nav
  - public desktop/mobile nav
  - admin login
  - admin protected route redirect
  - admin landmark create/edit/delete flow
  - logout/session clearing

Missing automated coverage:

- backend unit/integration tests
- API contract tests
- database migration tests
- SEO regression tests
- preview-flow tests
- upload/media tests
- auth/role tests beyond smoke behavior

## Existing SEO Implementation

Confirmed SEO work already present:

- base canonical, Open Graph, and Twitter tags in `public-frontend/index.html`
- build-time prerendered detail meta pages for:
  - news
  - obituaries
  - announcements
  - events
  - hall of fame
- runtime canonical-path normalization in detail pages
- Express-side HTML meta injection for:
  - `/events/:slug`
  - `/announcements/:slug`
- page-specific document title/meta mutation in some rich pages
- public and admin `robots.txt`

Current SEO gaps:

- no sitemap generation observed
- no structured data implementation observed
- no robots policy beyond static `robots.txt`
- no explicit noindex handling for preview routes
- list and static content routes have inconsistent meta strategy compared with detail routes

## Existing Analytics and Monitoring

Confirmed:

- no third-party analytics SDK found
- no visitor event pipeline found
- no real observability integration found
- no audit trail persistence found
- admin dashboard “Analytics Overview” is derived UI math over CMS content counts, not tracking data

Operational logging observed:

- server `console.error` and `console.warn`
- browser smoke captures console/network failures for tests only

## Routing and Compatibility Findings

Current routing includes multiple compatibility layers:

- public content is exposed under both old and new URL conventions in several domains
- admin APIs often support both REST-like current routes and older verb-style aliases
- contact and FAQ routes include `/api/v1` aliases
- server still hosts public detail HTML for some routes while frontends remain separate SPAs

This is important because the current system has already accumulated migration shims. Consolidation must preserve them or replace them with redirect/alias coverage.
