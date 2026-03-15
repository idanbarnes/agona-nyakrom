# Agona Nyakrom Agent Guide

## Purpose

This file governs how AI coding agents should work in `agona-nyakrom`.

This repository is an existing multi-app production-style system for the Agona Nyakrom community website:
- `public-frontend`: visitor-facing React/Vite site
- `admin-frontend`: authenticated CMS/admin dashboard
- `backend`: Express + PostgreSQL + Knex API serving both admin and public apps
- `scripts/frontends-smoke.mjs`: browser-based smoke test harness for public/admin flows

Work here as an operator inside an established system. Do not treat this repository like a starter app, redesign exercise, or architecture playground.

## Project Operating Principles

- Modify existing code before creating new files.
- Preserve the current app boundaries: public frontend, admin frontend, backend/API.
- Reuse existing components, hooks, service modules, form primitives, route loaders, and styling patterns before inventing new ones.
- Keep changes scoped to the task. Do not mix feature work with broad cleanup unless the cleanup directly reduces risk.
- Preserve CMS-to-public rendering contracts. Admin content exists to power public output.
- Preserve routing, auth, preview, upload, API, and published/draft behavior unless the task explicitly requires a change.
- Favor production-safe implementation over cleverness.
- Avoid speculative refactors and dependency additions.
- Match the repository’s current coding style and data shapes, even if you would design them differently from scratch.

## Repository Awareness

Inspect the current structure before editing. At minimum, orient yourself in:

### Public frontend
- `public-frontend/src/App.jsx`
- `public-frontend/src/routes/routeLoaders.js`
- `public-frontend/src/api/endpoints.js`
- `public-frontend/src/api/http.js`
- `public-frontend/src/pages`
- `public-frontend/src/components`
- `public-frontend/src/layouts` and `public-frontend/src/layout`

### Admin frontend
- `admin-frontend/src/App.jsx`
- `admin-frontend/src/routes/routeLoaders.js`
- `admin-frontend/src/services/api`
- `admin-frontend/src/lib/apiClient.js`
- `admin-frontend/src/lib/auth.js`
- `admin-frontend/src/pages`
- `admin-frontend/src/components/forms`
- `admin-frontend/src/components/preview`
- `admin-frontend/src/components/ui`

### Backend/API
- `backend/server.js`
- `backend/src/routes/public`
- `backend/src/routes/admin`
- `backend/src/controllers/public`
- `backend/src/controllers/admin`
- `backend/src/services`
- `backend/src/services/admin`
- `backend/src/services/public`
- `backend/src/middleware`
- `backend/migrations`

### Media and uploads
- `backend/src/middleware/uploadMiddleware.js`
- `backend/src/services/mediaService.js`
- `backend/uploads`

There is no dedicated shared workspace package. Do not force cross-app abstractions unless there is a clear repeated need.

## Existing-Project Rule

- This is not a rebuild.
- This is not a redesign unless the task explicitly says so.
- Do not rewrite working modules just because another pattern is preferable.
- Do not replace the routing strategy, auth flow, API client approach, or CMS structure without a concrete requirement.
- Do not introduce new libraries unless the current stack cannot safely support the task.

## Public Frontend Rules

The public site is route-driven and already lazily loaded through `public-frontend/src/routes/routeLoaders.js`.

- Preserve existing route behavior and URLs. Redirects such as legacy history/about paths exist for a reason.
- Prefer updating route definitions and existing pages over adding parallel routing structures.
- Preserve CMS-fed rendering. The homepage is powered by `GET /api/public/homepage` and currently supports block-driven rendering with fallback section rendering in `public-frontend/src/pages/Home.jsx`.
- Preserve preview-aware content behavior. Public detail endpoints use preview token handling via `appendPreviewToken`.
- Keep detail pages, CTA flows, grids, navigation, and forms stable.
- Maintain responsive behavior across desktop and mobile.
- Reuse existing public primitives such as `SmartLink`, `ImageWithFallback`, `ErrorState`, skeletons, cards, and section/layout patterns.
- Protect performance. The app already uses lazy routes and route prefetch helpers. Prefer route-level or high-impact optimizations over fragmenting the UI into excessive lazy boundaries.
- Preserve public asset resolution through `resolveAssetUrl` in `public-frontend/src/lib/apiBase.js`.

## Admin Frontend / CMS Rules

The admin app is protected by `ProtectedRoute` and session state in `admin-frontend/src/lib/auth.js` and `admin-frontend/src/context`.

- Preserve login, logout, redirect-after-login, and protected route behavior.
- Reuse `admin-frontend/src/services/api/*` and `admin-frontend/src/lib/apiClient.js` patterns for API work. Do not bypass the established auth/token handling without a reason.
- Preserve CRUD consistency across list/create/edit flows.
- Reuse existing admin form primitives and page patterns before building new ones:
  - `PhotoUploadField`
  - `SimpleRichTextEditor`
  - `FormActions`
  - `InlineError`
  - card/form wrappers in `components/ui`
- Preserve image upload behavior, preview behavior, draft/publish behavior, and validation UX.
- Preserve inline preview and preview redirect behavior where already present.
- Favor predictable admin UX and validation over hidden automation or “smart” form behavior.
- Any admin-side content change must be evaluated against public rendering impact.

## CMS and Data Integrity Rules

This project is content-driven. Schema and payload changes are high-risk.

- Trace the full data path before changing schema-related behavior:
  - database migration/model/service
  - backend controller/route response
  - admin service/form
  - public endpoint consumer
  - public page rendering
  - preview flow if applicable
- Preserve field names and payload shapes unless the change is intentional and fully propagated.
- Do not ship frontend-only workarounds that hide broken backend contracts.
- Preserve backward compatibility when practical. This codebase contains compatibility paths and aliases; do not remove them casually.
- Check loading, empty, error, and fallback states when content shape may vary.
- If content can be draft/unpublished, ensure public filtering still behaves correctly.

## Homepage and CMS Block Discipline

Homepage work is especially sensitive.

- `public-frontend/src/pages/Home.jsx` renders CMS-controlled homepage blocks and contains fallback behavior when blocks are missing.
- Admin homepage management lives under `admin-frontend/src/pages/homePageSections` and related homepage block/admin service modules.
- Backend homepage admin/public logic lives in dedicated homepage routes/controllers/services.
- Do not change homepage block types, field names, ordering behavior, or fallback assumptions without updating admin and public sides together.
- Preserve the ordered `blocks` contract from `/api/public/homepage`.

## Image and Media Handling Rules

Media is not generic here. It follows an existing pipeline.

- Preserve admin upload flows and existing persisted path behavior.
- Backend uploads enter `backend/uploads/tmp` through `uploadMiddleware`, then `mediaService` converts images to WebP variants in section-specific upload folders.
- Preserve current image constraints unless the task explicitly requires a change:
  - max file size around 5 MB
  - existing MIME restrictions
  - section-specific processing
  - carousel-specific crop/variant handling
- Do not break previews, existing asset URLs, or public rendering assumptions.
- Preserve aspect ratio handling and avoid stretching/distortion.
- Reuse existing upload components and backend media helpers before inventing feature-specific upload logic.
- Do not create inconsistent image rules across modules without a deliberate system-wide decision.

## Reusability and Component Discipline

- Search for existing components, wrappers, grids, cards, detail layouts, forms, upload fields, editors, and utilities before adding new ones.
- Prefer local reuse inside the relevant app over premature cross-app abstractions.
- Extract shared logic only when duplication is real and the new abstraction is simpler than the repeated code.
- Keep components readable. Do not create abstraction layers that make CMS behavior harder to trace.
- Match existing naming and folder conventions.

## Styling and UI/UX Guardrails

The frontends use React + Vite + Tailwind CSS. Preserve the established visual system.

- Use existing Tailwind conventions, utility composition, and UI primitives already present in each app.
- Maintain clean spacing, hierarchy, interaction states, and responsive behavior.
- Preserve accessibility basics: contrast, focus states, keyboard reachability, readable labels.
- Do not introduce ad hoc styling patterns when existing card/layout/form conventions already cover the case.
- Use motion only when it aligns with existing behavior. The public app already uses `framer-motion`; do not add gratuitous animation.
- Do not redesign working pages unless explicitly asked.

## Backend and API Guardrails

- Preserve the Express route structure in `backend/server.js`.
- Keep public routes, admin routes, and compatibility aliases intact unless change is required.
- Be careful with route aliases such as `/api/admin/asafo-companies` and `/api/admin/asafo`, and versioned aliases under `/api/v1`.
- Preserve server-rendered meta tag behavior for `/events/:slug` and `/announcements/:slug` when touching event/announcement detail flows.
- Prefer updating the existing controller/service pair for a feature instead of creating parallel endpoint logic.
- Database changes belong in Knex migrations under `backend/migrations`. Do not mutate schema ad hoc.
- When changing persisted content behavior, inspect relevant existing migrations first.

## Performance Guardrails

- Avoid unnecessary bundle growth.
- Prefer route-level or high-impact optimizations first.
- Do not over-fragment with excessive lazy loading. Both frontends already lazy-load route pages.
- Remove dead imports and dead code when touching a file.
- Preserve correctness and UX over micro-optimization.
- Treat bundle warnings as performance follow-up, not proof of functional correctness.

## Safe Change Workflow

For every task:

1. Inspect the relevant feature first.
2. Identify affected files across public, admin, backend, and migrations if relevant.
3. Trace the current data flow before editing.
4. Modify the existing implementation surgically.
5. Keep the change scoped to the request.
6. Avoid unrelated cleanup unless it directly reduces change risk.
7. State assumptions conservatively.
8. Do not claim success without verification.

## Refactor Rules

- Refactor only for clear safety, reuse, maintainability, or task-driven reasons.
- Do not refactor broad areas because code “looks cleaner” another way.
- Preserve existing behavior while refactoring.
- Use phased refactors for risky areas.
- Do not combine redesign, refactor, and feature expansion unless the task requires all three.

## Bug-Fix Rules

- Reproduce the bug or understand the failure path before editing.
- Fix the root cause when feasible.
- Do not apply cosmetic patches that only hide a deeper contract problem.
- Verify the fix in runtime/browser where applicable.
- Check adjacent flows likely to regress.

## Testing and Verification Workflow

Linting alone is not enough. Build success alone is not enough.

For meaningful completion, use a layered verification pass appropriate to the change:

- lint the affected frontend app(s)
- build the affected frontend app(s)
- verify relevant backend/API behavior when backend or schema changes are involved
- run targeted browser smoke testing for affected public/admin flows
- check browser console output for critical runtime errors
- verify touched routes and user flows directly
- check responsive behavior for touched UI
- verify CRUD behavior for affected admin modules
- verify public/admin integration when CMS data is involved

Repository-specific notes:
- `public-frontend` has `npm run lint`, `npm run build`, `npm run smoke:e2e`
- `admin-frontend` has `npm run lint`, `npm run build`, `npm run smoke:e2e`
- `scripts/frontends-smoke.mjs` can exercise public and admin flows and expects a usable Edge/Chrome binary; `BROWSER_BIN` can be set if needed
- smoke flows assume backend on `http://localhost:5000`, admin on `http://127.0.0.1:5173`, public on `http://127.0.0.1:5174`
- admin smoke login uses `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`

If backend changes affect runtime behavior but no automated test exists, call that out and compensate with targeted manual verification.

## Smoke Test Expectations

### Public frontend smoke checklist
- homepage loads
- navigation works
- key routes load
- detail page flows work for the affected content type
- forms/basic interactions work
- CMS-fed sections render without critical errors
- responsive layout remains usable on mobile and desktop
- console has no critical runtime errors

### Admin frontend smoke checklist
- unauthenticated access redirects to login
- login works
- protected routes behave correctly
- key dashboard or module pages load
- create/edit/list flow works for the affected module
- image upload/replacement works where relevant
- preview flow works where relevant
- logout/session clearing works
- console has no critical runtime errors

### CMS integration smoke checklist
When content structure or rendering changes:
- admin save succeeds
- backend response shape is correct
- public page renders updated content correctly
- draft/published visibility still behaves correctly
- fallbacks/empty states still make sense

## Completion Criteria

A task is done only when all of the following are true:

- the requested change is implemented
- existing behavior outside the requested scope is preserved
- CMS/public/admin contracts are not accidentally broken
- no unnecessary architectural damage was introduced
- affected lint/build steps pass, if available
- affected flows were smoke-tested in runtime/browser
- no critical console/runtime errors remain in touched areas
- the final report clearly states what changed, what was verified, and any residual risk

## Reporting Format

Future agents should report completion in this structure:

### Objective
- what was requested

### Files changed
- list of touched files by app

### Implemented
- what was changed
- any important data-flow or contract decisions

### Intentionally not changed
- adjacent areas left untouched on purpose

### Verification
- lint/build commands run
- smoke/manual flows verified
- any browser/console/API checks performed

### Residual risks
- anything not verified
- follow-up work if needed

## Forbidden Actions

- Do not rebuild the project.
- Do not redesign working UI unless explicitly asked.
- Do not rewrite large working areas without a task-driven reason.
- Do not silently change schema or payload contracts.
- Do not remove route aliases, preview paths, or compatibility endpoints casually.
- Do not introduce new dependencies without clear necessity.
- Do not bypass existing auth, upload, API client, or media patterns just to move faster.
- Do not create duplicate patterns when reusable ones already exist.
- Do not fake verification.
- Do not mark work complete based only on lint/build.
- Do not break CMS/public/admin coupling through local shortcuts.
- Do not ship frontend-only patches that mask backend data problems.
