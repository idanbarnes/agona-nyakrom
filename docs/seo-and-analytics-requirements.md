# SEO And Analytics Requirements

## SEO Principles

- SEO must cover all public modules, not only news.
- Preview routes and admin routes must not be indexed.
- Canonical routes must normalize legacy URL variants.
- Structured data should be added only where content semantics are clear.
- Analytics must be privacy-conscious and separated by purpose:
  - anonymous visitor analytics
  - authenticated user activity
  - administrative activity
  - system observability
  - audit trails

## Current SEO Baseline

Already implemented:

- public canonical and social tags in base HTML
- build-time prerendered social meta for news, obituaries, announcements, events, hall of fame
- Express-side meta injection for event and announcement details
- some client-side page-specific title/meta updates

Missing or incomplete:

- sitemap generation
- structured data
- robots/noindex strategy for previews
- consolidated canonical enforcement
- list-page metadata strategy consistency

## Public Route SEO Requirements

### Homepage `/`

- Index:
  - yes
- Canonical:
  - `/`
- Metadata:
  - title, description, social image, locale-aware community positioning
- Structured data:
  - `WebSite`
  - potentially `Organization` or `Place`
- Sitemap:
  - include
- Risks:
  - homepage block changes can alter primary internal linking

### News List `/news`

- Index:
  - yes
- Canonical:
  - `/news`
- Metadata:
  - section title, description, pagination-aware titles for page > 1
- Structured data:
  - section-level `CollectionPage`
- Sitemap:
  - include main list route
- Pagination:
  - paginated URLs should have self-canonicals and crawlable navigation
- Duplicate risk:
  - `/updates` currently points to same content and should likely canonicalize to `/news`

### News Detail `/news/:slug`

- Index:
  - yes when published
- Canonical:
  - `/news/:slug/`
- Metadata:
  - title, excerpt, image, publish/update dates if available
- Structured data:
  - `NewsArticle` or `Article`
- Sitemap:
  - include published items
- Duplicate risk:
  - preview URLs
  - `/updates` conceptual duplication if internal linking is inconsistent

### Obituary List `/obituaries`

- Index:
  - yes
- Canonical:
  - `/obituaries`
- Metadata:
  - respectful memorial-oriented title and description
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include
- Pagination:
  - required if list grows

### Obituary Detail `/obituaries/:slug`

- Index:
  - yes unless publication policy changes
- Canonical:
  - `/obituaries/:slug/`
- Metadata:
  - name, memorial summary, image, service details
- Structured data:
  - `Person`
  - possibly `Event` only if funeral-service semantics are explicit and desired
- Sitemap:
  - include published items
- Duplicate risk:
  - legacy `/obituary/:id`
  - slug and id variants

### Clans List `/clans`

- Index:
  - yes
- Canonical:
  - `/clans`
- Metadata:
  - lineage/community intro
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include

### Clan Detail `/clans/:slug`

- Index:
  - yes
- Canonical:
  - `/clans/:slug`
- Metadata:
  - clan name, intro/history summary, image
- Structured data:
  - likely none beyond generic `Article` or `WebPage`
- Sitemap:
  - include published items
- Local SEO:
  - moderate cultural heritage relevance

### Asafo List `/asafo-companies`

- Index:
  - yes
- Canonical:
  - `/asafo-companies`
- Metadata:
  - community organization summary
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include

### Asafo Detail `/asafo-companies/:slug`

- Index:
  - yes
- Canonical:
  - `/asafo-companies/:slug`
- Metadata:
  - organization name, history summary, image
- Structured data:
  - possibly `Organization` if content is positioned that way
- Sitemap:
  - include

### Hall Of Fame List `/hall-of-fame`

- Index:
  - yes
- Canonical:
  - `/hall-of-fame`
- Metadata:
  - recognition-focused title and description
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include

### Hall Of Fame Detail `/hall-of-fame/:slug`

- Index:
  - yes
- Canonical:
  - `/hall-of-fame/:slug/`
- Metadata:
  - honoree name, role/title, image, summary
- Structured data:
  - `ProfilePage`
  - `Person`
- Sitemap:
  - include published items

### Landmarks List `/landmarks`

- Index:
  - yes
- Canonical:
  - `/landmarks`
- Metadata:
  - tourism/discovery framing
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include
- Local SEO:
  - strong

### Landmark Detail `/landmarks/:slug`

- Index:
  - yes
- Canonical:
  - `/landmarks/:slug`
- Metadata:
  - landmark name, description, image
- Structured data:
  - `TouristAttraction`
  - `Place`
- Sitemap:
  - include published items
- Local SEO:
  - very strong due to address and coordinates

### About Pages `/about/history`, `/about/who-we-are`, `/about/about-agona-nyakrom-town`

- Index:
  - yes
- Canonical:
  - route-specific self-canonicals
- Metadata:
  - page-specific title, summary, and share image
- Structured data:
  - likely `AboutPage`
- Sitemap:
  - include
- Duplicate risk:
  - legacy `/history`

### Leadership List `/about/leadership-governance`

- Index:
  - yes
- Canonical:
  - `/about/leadership-governance`
- Metadata:
  - governance and leadership framing
- Structured data:
  - `CollectionPage`
  - possibly `Organization`
- Sitemap:
  - include

### Leadership Profile `/about/leadership-governance/:slug`

- Index:
  - yes
- Canonical:
  - `/about/leadership-governance/:slug`
- Metadata:
  - person name, role, profile image, summary
- Structured data:
  - `ProfilePage`
  - `Person`
- Sitemap:
  - include published items

### Announcements And Events Hub `/announcements-events`

- Index:
  - yes
- Canonical:
  - `/announcements-events`
- Metadata:
  - combined hub description
- Structured data:
  - `CollectionPage`
- Sitemap:
  - include
- Duplicate risk:
  - overlap with detail pages and any future separate list routes

### Event Detail `/events/:slug`

- Index:
  - yes when published
- Canonical:
  - `/events/:slug/`
- Metadata:
  - title, date, tag, flyer, summary
- Structured data:
  - `Event`
- Sitemap:
  - include published items
- Dynamic rendering:
  - already partly implemented server-side and should be preserved or replaced with equivalent SSR

### Announcement Detail `/announcements/:slug`

- Index:
  - yes when published
- Canonical:
  - `/announcements/:slug/`
- Metadata:
  - title, summary, flyer
- Structured data:
  - `Article`
- Sitemap:
  - include published items
- Dynamic rendering:
  - already partly implemented server-side and should be preserved or replaced with equivalent SSR

### Contact `/contact`

- Index:
  - yes
- Canonical:
  - `/contact`
- Metadata:
  - official contact information page
- Structured data:
  - `ContactPage`
  - `Organization`
  - possibly `PostalAddress`
- Sitemap:
  - include
- Local SEO:
  - strong if the site represents a real place/community body

## No-Index Requirements

Routes or URL states that should not be indexed:

- all `/admin/*`
- `/login`
- preview URLs carrying `preview_token` or `token`
- unpublished content fallbacks
- compatibility aliases that should canonically consolidate elsewhere

## Sitemap Requirements

Recommended sitemap groups:

- static pages sitemap
- news sitemap
- obituaries sitemap
- clans sitemap
- asafo sitemap
- hall of fame sitemap
- landmarks sitemap
- about and leaders sitemap
- announcements sitemap
- events sitemap

Each item should include:

- canonical URL
- last modified date
- publication filtering

## Duplicate-Content Priorities

High-priority duplicates to normalize:

- `/updates` versus `/news`
- `/obituary/:id` and `/obituary/:slug` versus `/obituaries/:slug/`
- `/history` versus `/about/history`
- `/about-nyakrom/leadership-governance` versus `/about/leadership-governance`
- `/api/public/asafo` versus `/api/public/asafo-companies` as API naming history
- preview-token variants of public detail pages

## Analytics Requirements

## 1. Anonymous Visitor Analytics

Collect only privacy-conscious aggregate events.

Recommended events:

- `page_view`
  - answers: which public sections are used most?
- `route_not_found_view`
  - answers: which broken links or missing pages are visitors hitting?
- `cta_click`
  - answers: which homepage and detail-page calls to action drive navigation?
- `content_card_click`
  - answers: which list items earn interest before full-page views?
- `share_intent`
  - answers: which content types people attempt to share?
- `media_gallery_open`
  - answers: which visual content types attract deeper engagement?
- `pagination_used`
  - answers: are users going beyond first-page content?
- `filter_used`
  - answers: which filters matter on events, clans, or other list pages?
- `external_link_click`
  - answers: which outbound resources or partner links matter?
- `map_link_click`
  - answers: are visitors trying to navigate to landmarks or memorial locations?

Privacy limits:

- no full IP addresses
- no keystroke capture
- no mouse movement capture
- no raw message-body capture
- no token capture

## 2. Authenticated User Activity

This applies to signed-in admins only if a broader user system is not introduced.

Recommended events:

- `admin_session_started`
  - answers: how often is the CMS used?
- `admin_session_expired_or_unauthorized`
  - answers: are auth issues affecting productivity?
- `preview_opened`
  - answers: which content types depend most on preview before publication?

## 3. Administrative Activity

These are product-operations events, not just observability.

Recommended events:

- `content_created`
  - answers: which modules are actively maintained?
- `content_updated`
  - answers: where is editorial workload concentrated?
- `content_deleted`
  - answers: which content removal actions need oversight?
- `publish_status_changed`
  - answers: how much draft versus live workflow exists by module?
- `display_order_changed`
  - answers: which curated modules are frequently merchandised?
- `image_uploaded`
  - answers: which modules drive storage and media operations?
- `faq_reordered`
  - answers: how often is support/contact content curated?
- `admin_user_created_or_updated`
  - answers: who is changing access?

## 4. System Observability

Recommended technical telemetry:

- API request latency by route group
- API error rate by route group
- auth failure counts
- upload failure counts
- preview token validation failures
- database transient error counts
- media storage mode failures
- prerender build failures

Business questions answered:

- where are reliability bottlenecks?
- which routes need performance work?
- are uploads or previews fragile in production?

## 5. Audit Trails

These should be persistent and queryable, not ephemeral logs.

Recommended audited actions:

- admin login success/failure
- admin account create/update/delete
- content create/update/delete
- publish/unpublish
- FAQ bulk actions
- contact info changes
- global settings changes
- preview token issuance

Each audit entry should capture:

- actor admin ID
- action type
- content/resource type
- resource ID
- timestamp
- minimal change summary

Avoid storing:

- passwords
- JWTs
- preview tokens in full
- raw sensitive payloads not needed for auditability
