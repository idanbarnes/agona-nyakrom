# Unified Runtime Smoke Test

## Preconditions

- local database is reachable
- backend environment is configured
- unified build has completed with `npm run build:unified`
- unified runtime is started with `npm run start:unified`
- admin credentials are available

## Automated Checks Already Added

- `GET /api/health` returns 200
- unknown `/api/*` returns JSON 404
- `/admin` serves the admin app shell
- `/admin/` serves the admin app shell
- deep `/admin/*` serves the admin app shell
- `/` serves the public app shell
- deep public routes serve the public app shell
- `/uploads/*` is not intercepted by SPA fallback
- preview-token public routes stay classified as public routes

## Manual Checklist

Public homepage:

- load `/`
- confirm homepage blocks render
- confirm navigation links work on desktop

Public functional domains from the inventory:

- `/news`
- `/updates`
- `/obituaries`
- `/clans`
- `/asafo-companies`
- `/landmarks`
- `/hall-of-fame`
- `/about/history`
- `/about/who-we-are`
- `/about/about-agona-nyakrom-town`
- `/about/leadership-governance`
- `/announcements-events`
- `/contact`

Admin auth:

- visit `/admin`
- verify unauthenticated redirect to `/admin/login`
- log in successfully
- verify `/admin/dashboard` loads
- log out successfully
- verify logout returns to `/admin/login`

Protected-route handling:

- open a protected admin URL in a fresh tab while logged out
- confirm redirect to `/admin/login`
- log in and confirm redirect-after-login returns to the requested admin route

Content management:

- create an article or equivalent content item
- edit an existing content item
- publish content
- verify public visibility rules still behave correctly

Preview:

- open admin preview for at least one preview-enabled resource
- confirm preview lands on the public route, not the admin app
- confirm preview token remains in the URL query string
- confirm preview content loads after browser refresh

Media:

- upload media through an existing admin flow
- verify the resulting media renders
- confirm existing Cloudinary-hosted media still load
- confirm existing local `/uploads/...` media still load

Routing:

- direct-navigate to `/admin`
- direct-navigate to `/admin/news`
- direct-navigate to a deep public route such as `/news/:slug`
- refresh each route and confirm the correct app loads

Mobile navigation:

- verify public mobile navigation opens and routes correctly
- verify admin mobile navigation drawer opens and routes correctly

## Suggested HTTP Sanity Checks

- `GET /api/health`
- `GET /admin`
- `GET /admin/news`
- `GET /`
- `GET /news/some-slug`
- `GET /uploads/<known-existing-file>`
- `GET /uploads/does-not-exist`

Expected results:

- admin HTML includes `/admin/assets/`
- public HTML includes `/assets/`
- missing upload returns 404
- unknown API routes return JSON, not HTML

## Not Verified In This Phase

- full browser walkthrough of every domain above
- create/edit/publish flows across every CMS module
- upload behavior against every media-backed content type
- mobile interaction in a real browser session for every route
