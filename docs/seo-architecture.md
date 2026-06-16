# SEO Architecture

## Configuration

Canonical public URLs are generated from `SITE_URL`. The backend also preserves the existing `UNIFIED_SITE_URL` and `PUBLIC_SITE_URL` fallback order for local transition work, but production requires a valid HTTPS public origin and rejects suspended Render service hostnames.

Related variables:

- `SITE_URL`: canonical public origin for HTML, sitemap, robots, and JSON-LD.
- `PUBLIC_ASSET_BASE_URL`: absolute origin for local `/uploads/...` assets when needed.
- `PUBLIC_SHARE_IMAGE_URL`: default social image.
- `PUBLIC_LOGO_URL`: optional organization logo URL.
- `PUBLIC_SOCIAL_PROFILES`: optional comma-separated public social profile URLs.

## Runtime HTML Strategy

The public frontend remains React/Vite. The unified Express runtime transforms the public `index.html` response for public HTML routes before sending it to crawlers and users. This avoids relying only on client-side DOM mutation for SEO metadata.

The transform inserts:

- document title;
- meta description;
- page robots directive;
- one canonical URL for indexable pages;
- Open Graph and Twitter/X metadata;
- JSON-LD structured data;
- minimal visible initial content for the transformed route.

The content is not user-agent specific and is not bot-only. Every HTML requester receives the same route-specific metadata.

## Route Data

Static and listing routes use centrally defined metadata in `backend/src/seo/routeSeoService.js`.

Detail routes load one published public record through existing public services:

- news;
- obituaries;
- clans;
- Asafo companies;
- hall of fame;
- landmarks;
- leadership profiles;
- events;
- announcements;
- about pages.

Preview-token routes and unknown routes are noindex. Missing public detail records return a noindex `404` HTML response when the database lookup completes and returns no record. If the database lookup itself fails, the runtime logs the error and serves the public shell with safe noindex fallback metadata instead of blocking all HTML delivery.

## Canonical URLs

Canonical URL generation is centralized in `backend/src/seo/descriptors.js` and `backend/src/seo/utils.js`.

Rules:

- origin comes from `SITE_URL`;
- paths are normalized to a single leading slash;
- duplicate slashes are collapsed;
- query strings and fragments are excluded;
- preview/noindex pages do not emit canonical tags;
- `/updates`, `/history`, `/about-nyakrom/leadership-governance`, and `/obituary/:slug` redirect to canonical route families.

## Structured Data

JSON-LD is generated only from available route data. Serialization escapes `<`, `>`, `&`, and line separators so JSON-LD cannot break out of the script element.

Implemented types include:

- `Organization`;
- `WebSite`;
- `WebPage`;
- `AboutPage`;
- `ContactPage`;
- `CollectionPage`;
- `NewsArticle`;
- `Article`;
- `Event`;
- `Person`;
- `TouristAttraction`;
- `BreadcrumbList`.

No fake ratings, coordinates, prices, opening hours, private contact details, or ticket data are generated.

## Sitemap And Robots

`GET /sitemap.xml` is generated dynamically from the database and static route matrix. It includes only canonical, public, published route families and omits admin, API, preview, tokenized, and unpublished content.

`GET /robots.txt` references the absolute sitemap URL. Production disallows obvious admin/API/preview/internal paths while allowing public assets. Development and test environments discourage indexing with `Disallow: /`.

## Admin

The admin HTML shell includes:

```html
<meta name="robots" content="noindex,nofollow" />
```

The Express admin fallback also injects the same directive if a built admin shell is missing it.

## Build-Time Prerendering

The existing public prerender script still runs after `vite build` and writes metadata files for selected detail pages. The unified Express runtime is the broader Phase 1 strategy because content changes after deployment can make build-time metadata stale. Regenerate the public build when relying on static hosting output; use the unified runtime for fresh database-backed metadata.

## Known Limitations

- The React app itself is still client-rendered beyond the minimal initial content injected into HTML.
- FAQ structured data is not emitted yet because the FAQ content is loaded inside the contact page at runtime and should be verified against visible-page eligibility before enabling.
- Sitemap generation requires database access.
- Final canonical production behavior depends on setting `SITE_URL` after domain purchase.
