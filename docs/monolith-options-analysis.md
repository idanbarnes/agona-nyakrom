# Monolith Options Analysis

## What “Monolith” Should Mean Here

For this project, “monolith” should mean one domain with coordinated routing and deployment, not an automatic rewrite into one framework.

Minimum acceptable outcome:

- public site served from `/`
- admin portal served from `/admin`
- APIs served from `/api`
- existing database preserved
- existing uploads preserved
- existing admin/public content contracts preserved

The current codebase is already logically monolithic at the data and API level. It is operationally split into three deployments.

## Evaluation Criteria

- migration risk
- SEO outcome
- maintainability
- deployment complexity
- database compatibility
- authentication compatibility
- feature preservation
- development effort
- rollback difficulty

## Option 1. Keep Current Apps, Consolidate Behind One Domain

### Description

Retain:

- `public-frontend` as its own Vite build
- `admin-frontend` as its own Vite build
- `backend` as its own Express service

Deploy behind one domain using a reverse proxy or single edge/router:

- `/` -> public frontend
- `/admin` -> admin frontend
- `/api` -> backend
- `/uploads` -> backend media

### Assessment

- Migration risk:
  - lowest
- SEO:
  - good, if proxying preserves canonical origins and static/meta routes
  - existing SEO behavior can largely be retained
- Maintainability:
  - moderate
  - keeps current code boundaries and duplicated frontend infrastructure
- Deployment complexity:
  - moderate
  - needs proxy or multi-origin routing, but not a rewrite
- Database compatibility:
  - excellent
- Authentication compatibility:
  - excellent
  - bearer-token auth continues to work with little or no change
- Feature preservation:
  - strongest
- Development effort:
  - lowest
- Rollback difficulty:
  - lowest

### Risks

- base-path handling for admin SPA under `/admin`
- asset and history-fallback rewrites
- CORS can be simplified, but misconfiguration can break admin/public flows
- SEO remains split between static prerender and Express injection

### Verdict

Best first-stage “monolith” interpretation. This is the safest path to a single domain without a rewrite.

## Option 2. Single Server Deployment, Keep Separate Frontend Builds

### Description

Package the two built frontends and the backend into one deployable server artifact, likely Express-hosted:

- Express serves API under `/api`
- Express serves built public SPA at `/`
- Express serves built admin SPA at `/admin`

### Assessment

- Migration risk:
  - low to moderate
- SEO:
  - good
  - easier to centralize redirects, canonical host enforcement, sitemap generation, and noindex rules
- Maintainability:
  - moderate to good
  - runtime becomes simpler than three independent services
- Deployment complexity:
  - lower than current once built
  - build pipeline becomes more complex
- Database compatibility:
  - excellent
- Authentication compatibility:
  - excellent
- Feature preservation:
  - very strong
- Development effort:
  - moderate
- Rollback difficulty:
  - moderate

### Risks

- Express static routing must not break current deep links
- admin build must work cleanly under `/admin`
- upload and preview URLs must be revalidated end to end
- social-meta generation currently assumes separate public build behavior

### Verdict

This is the strongest medium-term target if the goal is one deployable application without rewriting either frontend.

## Option 3. Merge Public and Admin Into One Next.js App, Keep Backend API Separate

### Description

Rebuild both frontends into one Next.js application:

- public pages under `/`
- admin pages under `/admin`
- backend continues serving `/api`

### Assessment

- Migration risk:
  - high
- SEO:
  - potentially best long-term
  - but only after substantial rebuild work
- Maintainability:
  - potentially good after migration
  - poor during migration because two UI applications must be reauthored
- Deployment complexity:
  - moderate after completion
- Database compatibility:
  - good because backend remains intact
- Authentication compatibility:
  - moderate
  - admin token storage and preview flows would need adaptation
- Feature preservation:
  - risky
- Development effort:
  - high
- Rollback difficulty:
  - high

### Risks

- all public and admin routing must be reimplemented
- existing CMS forms, previews, and upload flows must be ported
- current lazy-loaded React Router structure is not directly reusable
- high chance of regressions in SEO and admin UX during transition

### Verdict

Viable only as a later modernization phase, not as the first consolidation move.

## Option 4. Merge Public and Admin Into One Next.js App and Gradually Replace Backend APIs

### Description

Use one Next.js app for UI and progressively move backend functionality into:

- route handlers
- server actions
- framework-native rendering

### Assessment

- Migration risk:
  - highest
- SEO:
  - potentially strongest if fully executed well
- Maintainability:
  - uncertain until migration is complete
- Deployment complexity:
  - high during transition
- Database compatibility:
  - moderate
  - direct DB access and migration logic would need careful re-platforming
- Authentication compatibility:
  - low to moderate
  - current JWT model, preview tokening, and admin API contracts would all be touched
- Feature preservation:
  - weakest
- Development effort:
  - very high
- Rollback difficulty:
  - very high

### Risks

- de facto rewrite of working system
- preview, uploads, aliases, and compatibility endpoints likely to regress
- no backend test suite exists to protect the change

### Verdict

Not justified by current evidence. This should not be the recommended interpretation of “monolith.”

## Option 5. Keep Backend Separate Internally but Deploy As One Runtime Unit

### Description

This is a hybrid of Options 1 and 2:

- retain Express backend codebase
- retain both frontend codebases
- deploy them together in one environment or container
- unify hostname and routing at the same runtime boundary

### Assessment

- Migration risk:
  - low to moderate
- SEO:
  - good
- Maintainability:
  - good
- Deployment complexity:
  - moderate
- Database compatibility:
  - excellent
- Authentication compatibility:
  - excellent
- Feature preservation:
  - very strong
- Development effort:
  - moderate
- Rollback difficulty:
  - moderate

### Verdict

This is effectively the most pragmatic monolith target if “single server-deployed application” is required without paying rewrite cost.

## Recommended Path

Recommendation:

1. Treat the target monolith as a single-domain, single-runtime deployment first.
2. Preserve the current Express backend.
3. Preserve the current React/Vite public and admin apps initially.
4. Move to one-domain routing before considering frontend framework convergence.

Recommended sequence:

1. Option 1 as the first externally visible consolidation.
2. Option 2 or 5 as the operational simplification step.
3. Reassess whether a frontend merger is still worth the cost after SEO, analytics, and deployment issues are stabilized.

## Why A Full Rewrite Is Not Recommended

The repository already contains:

- production-like content models
- compatibility routes
- preview behavior
- media processing rules
- CMS workflows
- smoke-tested admin flows

There is not enough automated protection to justify a rewrite-first strategy. The current architecture can satisfy the single-domain goal with much less risk than a framework migration.
