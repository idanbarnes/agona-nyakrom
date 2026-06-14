# Migration Risk Register

## Summary

The project can be consolidated to one domain without a rewrite, but it has several fragile seams:

- path-based SPA hosting under `/admin`
- compatibility routes and legacy aliases
- mixed SEO delivery strategies
- preview-token query flows
- media URL normalization across local and Cloudinary storage
- limited automated tests, especially in the backend

## Risk Register

| ID | Risk | Severity | Likelihood | Affected Areas | Why It Can Break | Mitigation | Rollback Trigger |
|---|---|---|---|---|---|---|---|
| R1 | Admin SPA base-path breakage under `/admin` | High | High | Admin frontend routing, static assets, deep links | Current admin app assumes its own origin and route tree; hosting under `/admin` can break asset paths and reloads | Add explicit base-path support, verify direct-load on all admin routes, add route rewrite tests | Any direct-load 404 or broken asset after cutover |
| R2 | Public SPA rewrite collisions with backend detail routes | High | Medium | Public frontend, Express routing | `/events/:slug` and `/announcements/:slug` are currently intercepted by Express for meta injection | Decide whether Express keeps those routes or equivalent SSR replaces them before proxy consolidation | Detail pages lose metadata or return wrong HTML |
| R3 | Canonical and redirect regressions | High | High | SEO, routing | Current system has `/updates`, `/obituary/:id`, legacy history/about routes, and trailing-slash expectations | Preserve or replace with explicit redirect map and canonical tests | Search-facing URLs change without redirect coverage |
| R4 | Preview links stop working across host/path changes | High | Medium | Admin, public, backend | Preview depends on tokenized public URLs and resource mapping | Recompute preview target URL generation for new domain/path model and test every previewable resource | Preview links 401 incorrectly or point to wrong page |
| R5 | Admin auth state remains in `localStorage` while domain changes | Medium | Medium | Admin auth | Host/path changes can invalidate assumptions around redirects and unauthorized handling | Keep bearer model initially; defer cookie migration to later phase | Login/logout/me flows regress |
| R6 | CORS and origin settings become inconsistent during transitional rollout | Medium | Medium | Backend, both frontends | Current deployment relies on multiple origins; partial consolidation can accidentally block requests | Support dual-origin transitional config until final cutover | Public or admin requests fail preflight/origin checks |
| R7 | Media URLs break for local uploads | High | Medium | Public content, admin previews, uploads | Some records may still reference `/uploads/...` while hosted runtime expects Cloudinary | Inventory legacy local references, preserve `/uploads` routing, do not change media path semantics during domain consolidation | Any public images or preview images disappear |
| R8 | Cloudinary normalization inconsistencies surface during routing changes | Medium | Medium | Homepage, about pages, media service | Some services normalize `cloudinary://` references at read time | Keep current normalization layer intact and add regression checks | Image variants resolve differently between environments |
| R9 | Contact page assumed to have submission workflow when it does not | Medium | High | Product assumptions, migration scope | `contact_submissions` exists, but no live public POST route is wired | Treat contact as informational-only in migration scope unless user explicitly requests form activation later | Scope creep into unverified workflow |
| R10 | Legacy API aliases are removed prematurely | High | Medium | Admin frontend, public frontend, external clients if any | Backend exposes old and new endpoint shapes in several modules | Maintain aliases until logs and code confirm no callers remain | Existing admin screens or hidden consumers fail |
| R11 | Homepage block rendering breaks | High | Medium | Homepage CMS, public homepage | Block-driven homepage has multiple typed contracts and image-field conventions | Preserve `blocks` payload exactly during consolidation; test every block type | Homepage renders partial or empty sections |
| R12 | Event and announcement detail SEO regresses | High | High | Search, social sharing | These routes use special meta handling today | Preserve current behavior before changing route serving model | Link previews degrade or metadata disappears |
| R13 | Build pipeline fails when canonical host assumptions change | Medium | Medium | Public build | prerender script requires absolute origins and fails Render builds on invalid config | Update build environment docs and validate required origin vars in CI/build scripts | Build cannot publish public site |
| R14 | Missing backend tests allow unnoticed API regressions | High | High | Entire backend | No unit/integration test suite protects route and schema contracts | Add contract-focused smoke and route checks during migration phases | Production-only API regressions |
| R15 | Upload flows fail under consolidated hosting | High | Medium | Admin content creation/editing | Uploads involve tmp disk, Sharp processing, section-specific rules, and Cloudinary/local differences | Preserve backend upload endpoints exactly in early phases; run module-specific upload checks | Admin cannot create or update image-backed content |
| R16 | Master-admin-only user management becomes inaccessible | Medium | Low | Admin users | Role gate is simple but high-impact | Test `/admin/users` explicitly after auth/path changes | Admin access administration is blocked |
| R17 | Sitemap and robots rules omit important modules | Medium | High | SEO | Current implementation is partial and news-centric | Generate sitemap from all indexable content types, not only existing social-meta set | Important modules disappear from crawl coverage |
| R18 | Analytics implementation over-collects personal data | High | Medium | Compliance, privacy | New analytics work can drift into invasive collection if not constrained | Enforce event schema with minimized identifiers and no sensitive payload capture | Privacy review fails or collection exceeds scope |
| R19 | Audit trail is conflated with observability logs | Medium | Medium | Compliance, admin accountability | Console logs are not durable audit records | Separate operational telemetry from admin action audit storage | No reliable record of editorial/admin actions |
| R20 | Route namespace conflict between public pages and `/api` or `/admin` | High | Low | Reverse proxy, server routing | A single-domain router must reserve `/api`, `/admin`, and media paths before public fallback | Explicitly prioritize admin/api/uploads routes ahead of public fallback | Requests are served by wrong app |

## Highest-Risk Domains

The most consolidation-sensitive domains are:

- homepage blocks and carousel
- events and announcements
- media-backed content modules
- preview-enabled modules
- admin auth and admin users

## Documentation Gaps That Increase Risk

- no formal API contract documentation per module
- no route manifest for redirects and aliases
- no audit/event taxonomy today
- no explicit inventory of records still using local upload paths
- no automated verification for SEO outputs
