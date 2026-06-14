# Incremental Migration Plan

## Strategy

Use a phased consolidation strategy that preserves the existing public frontend, admin frontend, and Express backend codebases initially.

Target outcome:

- public app on `/`
- admin app on `/admin`
- backend API on `/api`
- uploads on `/uploads`

Do not begin with a framework rewrite. First stabilize domain consolidation, SEO, analytics foundations, and observability.

## Phase 0. Baseline Inventory And Safety Harness

### Objective

Create migration safeguards before routing or deployment changes.

### Domains Covered

- all public domains
- all admin domains
- auth
- preview
- media

### Affected Files And Modules

- `scripts/frontends-smoke.mjs`
- deployment config files
- docs created in this task

### Database Impact

- none

### Environment Variable Impact

- document current values only

### Tests

- expand smoke coverage matrix by module
- verify current direct-load behavior for public and admin routes
- capture baseline metadata for news, event, announcement, obituary, hall-of-fame detail pages

### Acceptance Criteria

- every public module and admin module has a baseline verification checklist
- redirect and alias inventory is documented
- previewable resource list is documented

### Rollback

- none required; documentation and test harness only

## Phase 1. Single-Domain Routing Design And Transitional Configuration

### Objective

Prepare the apps to operate under one hostname while still allowing current split deployment during rollout.

### Domains Covered

- public
- admin
- api
- uploads

### Affected Files And Modules

- `public-frontend/src/lib/apiBase.js`
- `admin-frontend/src/lib/apiClient.js`
- preview target URL helpers in admin frontend
- backend CORS/origin config
- deployment and reverse-proxy config

### Database Impact

- none

### Environment Variable Impact

- likely additions or revised usage for:
  - public origin
  - admin origin
  - api origin
  - canonical site origin

### Tests

- public API requests on same-origin paths
- admin API requests on same-origin paths
- direct-load tests for `/admin/*`
- preview URL generation tests

### Acceptance Criteria

- both frontends can resolve API URLs correctly when served from a shared domain
- no hard dependency remains on separate public/admin origins

### Rollback

- revert to existing per-origin env configuration and routing

## Phase 2. Host Admin Frontend Under `/admin`

### Objective

Move the admin SPA to a subpath without changing backend contracts.

### Domains Covered

- admin users
- admin auth
- every CMS content module

### Affected Files And Modules

- `admin-frontend/src/App.jsx`
- `admin-frontend/src/routes/routeLoaders.js`
- admin Vite config
- admin preview redirect logic
- protected-route logic
- deployment/router config

### Database Impact

- none

### Environment Variable Impact

- may require admin public base URL update or new base path variable

### Tests

- `/admin/login`
- `/admin/dashboard`
- every major admin list route direct-load
- login, logout, unauthorized redirect
- admin landmark smoke flow
- `/admin/users` for master admin

### Acceptance Criteria

- all admin routes work when loaded directly
- assets load correctly under `/admin`
- auth redirect-after-login still works

### Rollback

- restore admin frontend to dedicated subdomain/origin

## Phase 3. Keep API Under `/api` On The Shared Domain

### Objective

Expose the existing backend through the unified host without changing route shapes.

### Domains Covered

- all API-backed public modules
- all admin modules
- uploads
- preview

### Affected Files And Modules

- `backend/server.js`
- deployment/proxy config
- `backend/src/config/env.js`

### Database Impact

- none

### Environment Variable Impact

- `CORS_ALLOWED_ORIGINS` can be simplified after cutover
- `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`, `PUBLIC_ASSET_BASE_URL` may change

### Tests

- health endpoint
- all route groups return expected shapes
- upload endpoints still accept files
- `/uploads/*` assets remain reachable

### Acceptance Criteria

- both frontends operate against `/api` on the same host
- no broken CORS or asset issues remain

### Rollback

- point frontends back to the existing API origin

## Phase 4. Preserve SEO Behavior During Host Consolidation

### Objective

Move to one domain without losing metadata, canonical handling, or redirect coverage.

### Domains Covered

- homepage
- news
- obituaries
- clans
- asafo
- landmarks
- hall of fame
- about pages
- leaders
- announcements
- events
- contact

### Affected Files And Modules

- `public-frontend/scripts/prerender-social-meta.mjs`
- `public-frontend/index.html`
- public detail pages that mutate canonical/meta tags
- `backend/server.js` event and announcement HTML handlers
- public `robots.txt`
- new sitemap generator modules

### Database Impact

- none

### Environment Variable Impact

- canonical/public site origin must be updated and validated

### Tests

- verify canonical tags for every public detail type
- verify redirects for legacy paths
- verify social preview HTML for event and announcement detail routes
- verify sitemap entries for all published modules
- verify admin and preview pages are excluded from indexing

### Acceptance Criteria

- all current SEO-critical routes preserve or improve metadata output
- legacy public URLs redirect correctly
- sitemap covers all indexable modules

### Rollback

- restore prior host-specific canonical config and disable new sitemap/redirect layer if needed

## Phase 5. Introduce Privacy-Conscious Analytics Foundations

### Objective

Add anonymous visitor analytics and admin activity telemetry with clear boundaries.

### Domains Covered

- all public routes
- admin usage flows
- observability
- audit logging

### Affected Files And Modules

- shared frontend instrumentation points
- backend request instrumentation
- admin CRUD endpoints
- new audit/analytics persistence modules if approved later

### Database Impact

- likely new analytics and audit tables if persistence is added
- no change to existing content tables

### Environment Variable Impact

- analytics provider or internal telemetry configuration

### Tests

- verify events fire only on approved interactions
- verify no sensitive fields are sent
- verify admin activity and system observability are separated

### Acceptance Criteria

- event taxonomy matches the documented privacy rules
- no passwords, tokens, raw IPs, or freeform message bodies are stored

### Rollback

- disable instrumentation via config flag and stop consuming new events

## Phase 6. Single Runtime Packaging

### Objective

Reduce operational complexity by serving the three current app layers from one deployable runtime or coordinated runtime unit.

### Domains Covered

- all domains

### Affected Files And Modules

- backend server/static hosting config
- frontend build outputs
- deployment manifests

### Database Impact

- none

### Environment Variable Impact

- likely consolidation and reduction of duplicate frontend origin variables

### Tests

- full smoke pass across public and admin
- metadata verification
- upload verification
- preview verification
- performance sanity checks

### Acceptance Criteria

- one deployment unit or one tightly coordinated runtime serves `/`, `/admin`, `/api`, and `/uploads`
- no feature regression versus baseline

### Rollback

- redeploy prior split topology with unchanged database and storage

## Phase 7. Optional Later Modernization Review

### Objective

Reassess whether merging frontends into one framework is still worth the cost after consolidation succeeds.

### Domains Covered

- all public and admin UI domains

### Affected Files And Modules

- would be broad; defer until prior phases are stable

### Database Impact

- potentially none if backend retained

### Environment Variable Impact

- to be defined later

### Tests

- only after a fresh decision record and broader automated coverage exist

### Acceptance Criteria

- rewrite only proceeds if it clearly improves SEO or maintainability enough to outweigh migration risk

### Rollback

- continue using the consolidated current-stack solution

## Domain-by-Domain Migration Notes

### News

- Preserve routes, preview, image handling, and `/updates` compatibility.

### Obituaries

- Preserve legacy `/obituary/*` redirects and memorial detail metadata.

### Clans

- Preserve featured filtering and clan-leader associations.

### Asafo

- Preserve both `/asafo` API aliasing and `/asafo-companies` public route semantics.

### Landmarks

- Preserve maps/coordinates behavior and media handling.

### Hall Of Fame

- Preserve homepage spotlight dependency and detail-route metadata generation.

### About And Leaders

- Preserve slug-specific about pages and governance profile routes.

### Events And Announcements

- Preserve special meta delivery and shared hub behavior.

### Contact And FAQs

- Preserve informational contact behavior; do not invent submission workflow during consolidation.

### Homepage

- Preserve `GET /api/public/homepage` ordered `blocks` contract and every current block type.

### Admin Users And Auth

- Preserve JWT login flow initially; do not mix auth-model migration into first domain-consolidation phases.
