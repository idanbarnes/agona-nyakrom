# SEO Route Matrix

| Route family | Indexing | Metadata source | Canonical pattern | Structured data | Sitemap | Rendering strategy | Known limitations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | index | central config | `/` | `Organization`, `WebSite` | yes | Express HTML transform | Homepage block content remains client-rendered |
| `/news` | index | static route config | `/news` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Query-string pagination is not canonicalized yet |
| `/updates` | redirect | redirect map | `/news` | none | no | 301 redirect | Legacy duplicate route |
| `/news/:slug` | index when published; noindex preview/missing | published news record | `/news/:slug` | `NewsArticle`, breadcrumb | yes | Express HTML transform with DB lookup; build prerender also exists | DB errors fall back to safe shell metadata |
| `/obituaries` | index | static route config | `/obituaries` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Listing content client-rendered |
| `/obituaries/:slug` | index when published; noindex preview/missing | published obituary record | `/obituaries/:slug` | `WebPage` with `Person` main entity, breadcrumb | yes | Express HTML transform with DB lookup; build prerender also exists | Does not invent funeral event or article schema |
| `/obituary/:slug` | redirect | redirect map | `/obituaries/:slug` | none | no | 301 redirect | Legacy route |
| `/clans` | index | static route config | `/clans` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Listing content client-rendered |
| `/clans/:slug` | index when published; noindex preview/missing | published clan record | `/clans/:slug` | `Article`, breadcrumb | yes | Express HTML transform with DB lookup | Clan leaders remain client-rendered |
| `/asafo-companies` | index | static route config | `/asafo-companies` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Listing content client-rendered |
| `/asafo-companies/:slug` | index when published; noindex preview/missing | published Asafo record | `/asafo-companies/:slug` | `Organization`, breadcrumb | yes | Express HTML transform with DB lookup | Uses `Organization` only for actual Asafo company entries |
| `/landmarks` | index | static route config | `/landmarks` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Listing content client-rendered |
| `/landmarks/:slug` | index when published; noindex preview/missing | published landmark record | `/landmarks/:slug` | `TouristAttraction`, breadcrumb | yes | Express HTML transform with DB lookup | Coordinates and hours are not emitted |
| `/hall-of-fame` | index | static route config | `/hall-of-fame` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Listing content client-rendered |
| `/hall-of-fame/:slug` | index when published; noindex preview/missing | published hall-of-fame record | `/hall-of-fame/:slug` | `Person`, breadcrumb | yes | Express HTML transform with DB lookup; build prerender also exists | No private fields emitted |
| `/about/history` | index when published; noindex missing/unpublished | published about page record | `/about/history` | `AboutPage`, breadcrumb | yes, only when published | Express HTML transform with DB lookup | Legacy `/history` redirects here |
| `/history` | redirect | redirect map | `/about/history` | none | no | 301 redirect | Legacy route |
| `/about/who-we-are` | index when published; noindex missing/unpublished | published about page record | `/about/who-we-are` | `AboutPage`, breadcrumb | yes, only when published | Express HTML transform with DB lookup | Body remains client-rendered |
| `/about/about-agona-nyakrom-town` | index when published; noindex missing/unpublished | published about page record | `/about/about-agona-nyakrom-town` | `AboutPage`, breadcrumb | yes, only when published | Express HTML transform with DB lookup | Body remains client-rendered |
| `/about/leadership-governance` | index | static route config | `/about/leadership-governance` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Profiles client-rendered on list |
| `/about-nyakrom/leadership-governance` | redirect | redirect map | `/about/leadership-governance` | none | no | 301 redirect | Legacy route |
| `/about/leadership-governance/:slug` | index when published; noindex preview/missing | published leader record | `/about/leadership-governance/:slug` | `Person`, breadcrumb | yes | Express HTML transform with DB lookup | No private contact details emitted |
| `/announcements-events` | index | static route config | `/announcements-events` | `CollectionPage`, breadcrumb | yes | Express HTML transform | Combined hub content client-rendered |
| `/events/:slug` | index when published; noindex preview/missing | published event record | `/events/:slug` | `Event`, breadcrumb | yes | Express HTML transform with DB lookup; build prerender also exists | Does not invent venue, price, attendance mode, or status |
| `/announcements/:slug` | index when published; noindex preview/missing | published announcement record | `/announcements/:slug` | `Article`, breadcrumb | yes | Express HTML transform with DB lookup; build prerender also exists | Not treated as event solely because it may mention a date |
| `/contact` | index | static route config | `/contact` | `ContactPage`, breadcrumb | yes | Express HTML transform | FAQ JSON-LD deferred |
| `/admin`, `/admin/*` | noindex | admin shell | none | none | no | Admin SPA shell with noindex | Auth behavior unchanged |
| `/api/*` | noindex by status | API routing | none | none | no | JSON API routes | Unknown API routes return JSON 404 |
| `/uploads/*` | asset | static media | none | none | no | Express static assets | Missing assets return 404, not SPA HTML |
| Preview/token URLs | noindex | route policy | none | none | no | Express HTML transform | Token-bearing URLs are not canonicalized |
| Unknown public routes | noindex | route policy | none | none | no | Express HTML transform | Returns noindex 404 HTML |
