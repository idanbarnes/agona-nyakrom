# SEO Validation Checklist

## Automated

- Run backend tests: `npm --prefix backend test`.
- Run duplicate/critical metadata validation: `npm --prefix backend run seo:validate`.
- Run public lint: `npm --prefix public-frontend run lint`.
- Run admin lint if admin source changes: `npm --prefix admin-frontend run lint`.
- Run public production build with a local backend available: `npm --prefix public-frontend run build`.
- Run unified production build with a local backend available: `npm run build:unified`.

## Raw HTML Checks

Inspect raw HTTP responses, not only the browser DOM:

- `/`
- `/news/:slug`
- `/events/:slug`
- `/announcements/:slug`
- `/landmarks/:slug`
- `/clans/:slug` or `/asafo-companies/:slug`
- `/hall-of-fame/:slug` or `/about/leadership-governance/:slug`
- `/about/history`, `/about/who-we-are`, or `/about/about-agona-nyakrom-town`
- `/admin`
- a missing public detail route
- `/robots.txt`
- `/sitemap.xml`

For indexable routes, confirm:

- one correct `<title>`;
- meta description;
- one canonical URL;
- `robots` is `index,follow`;
- Open Graph title, description, URL, image, image alt, site name, and locale;
- Twitter/X summary card tags;
- JSON-LD with the expected type;
- obituary JSON-LD uses a `WebPage` with a deceased `Person` as `mainEntity`;
- initial visible content includes heading, description/excerpt, relevant dates, author/profile identity where applicable, and a safe image when one exists;
- no suspended Render URLs;
- local `/uploads/...` images are absolute;
- Cloudinary URLs are preserved;
- admin, API, preview, and `/uploads/tmp` image URLs are not exposed in metadata.

For noindex routes, confirm:

- `/admin` and `/admin/*` include `noindex,nofollow`;
- preview-token URLs include `noindex,nofollow`;
- missing public details return `404` when the database lookup confirms no record;
- no public canonical tag is emitted for noindex pages.

## Sitemap Checks

Confirm `/sitemap.xml` includes only:

- static public pages;
- published news;
- published obituaries;
- published clans;
- published Asafo companies;
- published hall-of-fame profiles;
- published landmarks;
- published leadership profiles;
- published events;
- published announcements;
- published CMS about pages.

Confirm it excludes:

- admin routes;
- API routes;
- preview routes;
- tokenized URLs;
- unpublished records;
- unpublished CMS about pages;
- empty slugs;
- legacy duplicate routes.

## Robots Checks

Production should:

- allow public crawling;
- disallow obvious admin/API/preview/internal paths;
- reference the absolute sitemap URL.

Development and test should discourage indexing with `Disallow: /`.

## Manual Deployment Tasks

After the final domain is purchased:

- set `SITE_URL` to the final HTTPS public origin;
- verify the domain;
- configure or upload the final default social image;
- submit `/sitemap.xml` in Google Search Console;
- run URL Inspection on representative routes;
- test representative pages in Rich Results Test;
- verify legacy redirects from any restored old public URLs;
- keep `PUBLIC_SOCIAL_PROFILES`, `PUBLIC_LOGO_URL`, and contact/geographic fields empty unless confirmed.

Do not configure visitor analytics as part of this SEO phase.
