# SEO Known Limitations

## Rendering Tiers

### Full initial crawlable content

No public route family is fully server-rendered today. The public frontend remains a React/Vite client-rendered app, and Express performs HTML metadata and summary-content transformation only.

### Summary-only initial content

These route families receive route-specific metadata and compact visible initial content before React hydration:

- `/`
- `/news/:slug`
- `/obituaries/:slug`
- `/clans/:slug`
- `/asafo-companies/:slug`
- `/landmarks/:slug`
- `/hall-of-fame/:slug`
- `/about/history`
- `/about/who-we-are`
- `/about/about-agona-nyakrom-town`
- `/about/leadership-governance/:slug`
- `/events/:slug`
- `/announcements/:slug`

The injected content includes the page heading, primary description or excerpt, relevant dates when available, author or profile identity when available, and a safe image URL when available. It is the same content for all HTML requesters and is not bot-only.

### JavaScript-dependent content

These route families still depend on React and API responses for complete body/list rendering:

- `/news`
- `/obituaries`
- `/clans`
- `/asafo-companies`
- `/landmarks`
- `/hall-of-fame`
- `/about/leadership-governance`
- `/announcements-events`
- `/contact`
- complete body sections for all detail pages after the initial summary

## Deferred Until Domain Purchase

- Set `SITE_URL` to the final HTTPS domain.
- Configure the final default share image and logo URLs.
- Verify the domain in Google Search Console.
- Submit `/sitemap.xml`.
- Run URL Inspection for representative static, listing, detail, missing, and redirected routes.
- Validate representative structured data in Rich Results Test or Schema Markup Validator.
- Re-check that production HTML contains no localhost or suspended Render URLs.

## Future SSR Case

Migrating the public frontend to SSR would be justified if complete listing/detail body content must be crawlable without JavaScript, if Search Console reports persistent discovery/rendering issues, or if richer structured data must be generated from content currently assembled only in React. Until then, the unified Express transform keeps SEO metadata centralized without replacing the current frontend architecture.
