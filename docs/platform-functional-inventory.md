# Platform Functional Inventory

## Scope

This inventory is based on repository inspection only. It does not assume features that are not represented in routes, schema, services, or UI code.

`AGENT.md` instructs agents to preserve the current three-app boundaries. That conflicts with the long-term consolidation brief, but it matches the current production architecture and should be treated as a migration constraint rather than changed during this task.

## Product Summary

Agona Nyakrom is a content-driven community platform with three deployed applications:

- `public-frontend`: visitor-facing website.
- `admin-frontend`: authenticated CMS and operations dashboard.
- `backend`: Express API, media pipeline, preview services, and compatibility endpoints.

The platform is broader than a news site. It currently spans public information publishing, cultural/community content, event and announcement publishing, memorial content, directory-style tourism/community sections, homepage composition, and CMS administration.

## Functional Domains

### 1. Homepage and Public Navigation

- Public routes:
  - `/`
  - legacy redirects in the public app for `/history` and `/about-nyakrom/leadership-governance`
- Admin routes:
  - `/admin/homepage-sections`
  - `/admin/homepage-sections/create`
  - `/admin/homepage-sections/edit/:id`
- API surfaces:
  - `GET /api/public/homepage`
  - `GET /api/public/carousel`
  - `GET /api/admin/homepage-sections`
  - `POST|PUT|DELETE /api/admin/homepage-sections...`
  - `GET /api/admin/homepage-blocks`
  - `POST|PUT|DELETE /api/admin/homepage-blocks...`
  - `GET|POST|PUT|DELETE /api/admin/carousel...`
- Data sources:
  - `homepage_blocks`
  - `homepage_sections`
  - `carousel_slides`
  - legacy `carousel_items`
  - `global_settings`
- Current homepage block types:
  - `welcome`
  - `editorial_feature`
  - `who_we_are`
  - `hall_of_fame_spotlight`
  - `news_highlight`
  - `cultural_break`
  - `gateway_links`
- Notes:
  - Homepage is CMS-composed, not hardcoded.
  - `gateway_links` acts as a routing hub into other public modules.

### 2. News and Updates

- Public routes:
  - `/news`
  - `/updates`
  - `/news/:slug`
- Admin routes:
  - `/admin/news`
  - `/admin/news/create`
  - `/admin/news/edit/:id`
  - `/admin/news/:id/preview`
- API surfaces:
  - `GET /api/public/news`
  - `GET /api/public/news/:slug`
  - `GET /api/public/news/preview`
  - `GET /api/admin/news/all`
  - `GET /api/admin/news/single/:id`
  - `POST /api/admin/news/create`
  - `PUT /api/admin/news/update/:id`
  - `DELETE /api/admin/news/delete/:id`
- Data sources:
  - `news`
- Notes:
  - This is both a standalone public domain and a homepage feed source.
  - Preview-aware public delivery is implemented via tokenized public access.

### 3. Obituaries and Memorial Notices

- Public routes:
  - `/obituaries`
  - `/obituaries/:slug`
  - legacy `/obituary/:id`
  - Render redirects from `/obituary/:slug` to `/obituaries/:slug/`
- Admin routes:
  - `/admin/obituaries`
  - `/admin/obituaries/create`
  - `/admin/obituaries/edit/:id`
  - `/admin/obituaries/:id/preview`
- API surfaces:
  - `GET /api/public/obituaries`
  - `GET /api/public/obituaries/:slug`
  - `GET /api/admin/obituaries/all`
  - `GET /api/admin/obituaries/single/:id`
  - `POST /api/admin/obituaries/create`
  - `PUT /api/admin/obituaries/update/:id`
  - `DELETE /api/admin/obituaries/delete/:id`
- Data sources:
  - `obituaries`
- Notes:
  - This is a distinct memorial workflow, not generic news.
  - Content includes service timing and location data.

### 4. Family Clans

- Public routes:
  - `/clans`
  - `/clans/:slug`
- Admin routes:
  - `/admin/clans`
  - `/admin/clans/create`
  - `/admin/clans/edit/:id`
  - `/admin/clans/:id/preview`
- API surfaces:
  - `GET /api/public/clans`
  - `GET /api/public/clans/:slug`
  - `GET /api/admin/clans`
  - `POST|PUT|DELETE /api/admin/clans`
  - legacy admin aliases under `/create`, `/update/:id`, `/delete/:id`, `/all`, `/single/:id`
- Data sources:
  - `family_clans`
  - `clan_leaders`
- Notes:
  - This is a community lineage and leadership domain.
  - The public list supports a featured filter.

### 5. Asafo Companies

- Public routes:
  - `/asafo-companies`
  - `/asafo-companies/:slug`
- Admin routes:
  - `/admin/asafo-companies`
  - `/admin/asafo-companies/section/:sectionId`
  - `/admin/asafo-companies/:id/preview`
- API surfaces:
  - `GET /api/public/asafo`
  - `GET /api/public/asafo/:slug`
  - compatibility aliases under `/api/public/asafo-companies`
  - `GET|POST|PUT|DELETE /api/admin/asafo...`
  - compatibility aliases under `/api/admin/asafo-companies`
- Data sources:
  - `asafo_companies`
- Notes:
  - This is a structured cultural/community organization domain with refactored entry-based data.

### 6. Landmarks and Attractions

- Public routes:
  - `/landmarks`
  - `/landmarks/:slug`
- Admin routes:
  - `/admin/landmarks`
  - `/admin/landmarks/create`
  - `/admin/landmarks/edit/:id`
  - `/admin/landmarks/:id/preview`
- API surfaces:
  - `GET /api/public/landmarks`
  - `GET /api/public/landmarks/:slug`
  - `GET|POST|PUT|DELETE /api/admin/landmarks...`
- Data sources:
  - `landmarks`
- Notes:
  - This is the clearest tourism/attractions module.
  - Schema includes category, address, coordinates, and video URL.

### 7. Hall of Fame

- Public routes:
  - `/hall-of-fame`
  - `/hall-of-fame/:slug`
- Admin routes:
  - `/admin/hall-of-fame`
  - `/admin/hall-of-fame/create`
  - `/admin/hall-of-fame/edit/:id`
  - `/admin/hall-of-fame/:id/preview`
- API surfaces:
  - `GET /api/public/hall-of-fame`
  - `GET /api/public/hall-of-fame/:slug`
  - `GET|POST|PUT|DELETE /api/admin/hall-of-fame...`
- Data sources:
  - `hall_of_fame`
- Notes:
  - This is a featured recognition and heritage domain.
  - It is also reused in homepage spotlight blocks.

### 8. About Agona Nyakrom

- Public routes:
  - `/about/history`
  - `/about/who-we-are`
  - `/about/about-agona-nyakrom-town`
  - `/about/leadership-governance`
  - `/about/leadership-governance/:slug`
- Admin routes:
  - `/admin/history`
  - `/admin/about-nyakrom/:slug`
  - `/admin/about-nyakrom/leadership-governance`
  - `/admin/leaders` APIs only; no separate page route because leader management is embedded in the leadership page
  - preview routes for about pages and leaders
- API surfaces:
  - `GET /api/public/history`
  - `GET /api/public/about/:slug`
  - `GET /api/public/leaders`
  - `GET /api/public/leaders/:slug`
  - `GET|PUT /api/admin/history`
  - `GET|PUT|PATCH /api/admin/about-pages/:slug`
  - `GET|POST|PUT|PATCH|DELETE /api/admin/leaders`
- Data sources:
  - `history_page`
  - `about_pages`
  - `leaders`
  - legacy `history`, `past_leaders`
- Notes:
  - This is a multi-part editorial domain covering town history and governance.
  - Leadership has both collection and profile detail pages.

### 9. Events

- Public routes:
  - `/announcements-events`
  - `/events/:slug`
- Admin routes:
  - `/admin/events`
  - `/admin/events/new`
  - `/admin/events/:id/edit`
  - `/admin/events/:id/preview`
- API surfaces:
  - `GET /api/public/events`
  - `GET /api/public/events/:slug`
  - `GET /api/public/announcements-events`
  - `GET|POST|PUT|DELETE /api/admin/events`
- Data sources:
  - `events`
- Notes:
  - Public events are grouped with announcements in a shared landing page.
  - Event state logic distinguishes `coming_soon`, `upcoming`, and `past`.

### 10. Announcements

- Public routes:
  - `/announcements-events`
  - `/announcements/:slug`
- Admin routes:
  - `/admin/announcements`
  - `/admin/announcements/new`
  - `/admin/announcements/:id/edit`
  - `/admin/announcements/:id/preview`
- API surfaces:
  - `GET /api/public/announcements`
  - `GET /api/public/announcements/:slug`
  - `GET /api/public/announcements-events`
  - `GET|POST|PUT|DELETE /api/admin/announcements`
- Data sources:
  - `announcements`
- Notes:
  - This is a separate content type, not just a news subtype.

### 11. Contact Information and FAQs

- Public routes:
  - `/contact`
- Admin routes:
  - `/admin/contact`
  - `/admin/faqs`
- API surfaces:
  - `GET /api/public/contact`
  - `GET /api/public/contact/sections`
  - `GET /api/public/faqs`
  - versioned aliases under `/api/v1/contact` and `/api/v1/faqs`
  - `GET|PUT|PATCH /api/admin/contact`
  - `GET|POST|PUT|PATCH|DELETE /api/admin/faqs`
  - compatibility aliases under `/api/faqs`
- Data sources:
  - `contact_info`
  - `contact_faqs`
- Notes:
  - The current public contact page is informational.
  - There is no active public message submission endpoint in current routing.

### 12. Admin Users and Authentication

- Public routes:
  - none
- Admin routes:
  - `/login`
  - `/dashboard`
  - `/admin/users`
- API surfaces:
  - `POST /api/admin/auth/bootstrap`
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/auth/me`
  - `GET /api/admin/auth/profile`
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PUT /api/admin/users/:id`
  - `DELETE /api/admin/users/:id`
- Data sources:
  - `admins`
- Notes:
  - Roles are coarse-grained: `admin` and `master_admin`.
  - Admin management is restricted to `master_admin`.

### 13. Preview Workflow

- Public routes:
  - public detail pages accept query-string preview tokens
- Admin routes:
  - `/admin/:resource/:id/preview`
- API surfaces:
  - `GET /api/admin/preview/resources`
  - `GET /api/admin/:resource/:id/preview`
- Data sources:
  - no separate preview table; preview access is JWT-token based
- Notes:
  - Preview currently supports: news, obituaries, clans, asafo, hall of fame, landmarks, carousel, events, announcements, leaders, about pages, and FAQs.

### 14. Global Settings and Shared Site Chrome

- Public routes:
  - used indirectly by shared layout
- Admin routes:
  - `/admin/global-settings`
- API surfaces:
  - `GET /api/public/global-settings`
  - `GET /api/global-settings`
  - `GET|PUT /api/admin/global-settings`
- Data sources:
  - `global_settings`
- Notes:
  - Drives site name, tagline, footer, navigation, and contact summary values.

## Features Not Confirmed As Live Domains

The brief listed several possible domains. The following are not confirmed as live end-user modules in the current codebase:

- jobs or opportunities
- businesses beyond Asafo companies
- public services as a dedicated module
- site-wide search
- public notifications
- user self-service accounts
- enquiry submission inbox workflow

## Dormant or Legacy Artifacts Worth Tracking

- `contact_submissions` table and model exist, but no current public POST route or admin review UI is wired to them.
- `history`, `past_leaders`, `homepage_settings`, and `carousel_items` remain in the schema lineage but are no longer the main public delivery path.
- Multiple compatibility aliases exist across old and new admin/public endpoints and will matter during consolidation.
