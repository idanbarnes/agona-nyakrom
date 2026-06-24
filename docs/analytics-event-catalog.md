# Analytics Event Catalog

All events include: `event_type`, `anon_session_id`, `page_path`, `page_title`, `referrer_category`, `device_category`, campaign fields when present, and server-side `occurred_at`.

Allowed events:

| Event | Business Question | Extra Fields |
| --- | --- | --- |
| `page_view` | Which public pages are viewed? | content type/slug when derivable |
| `content_view` | Which public content detail pages are viewed? | content type, content ID/slug when available |
| `search_performed` | What public in-page searches happen and how many results do they return? | sanitized search query, result count |
| `search_result_clicked` | Which searched result links are selected? | sanitized query, result position when available, content type/slug |
| `zero_result_search` | What searches return no matches? | sanitized search query, result count `0` |
| `share_clicked` | Which share destinations are used? | target domain/path metadata |
| `related_content_clicked` | Which related internal content links are used? | target path metadata, content type/slug |
| `outbound_link_clicked` | Which external domains receive public clicks? | target domain/path metadata |
| `contact_action_clicked` | Are phone/email contact actions used? | target type only, not address contents |
| `read_depth` | How far visitors read on public pages? | milestone: 25, 50, 75, or 90 |

Content types are allowlisted to current public domains: `home`, `news`, `obituary`, `family_clan`, `asafo_company`, `landmark`, `hall_of_fame`, `leader`, `event`, `announcement`, `about`, `contact`, and `faq`.

Fields deliberately not collected: passwords, JWTs, cookies, authorization headers, raw IP addresses, exact geolocation, form contents, contact-message contents, complete referrer URLs, and arbitrary unvalidated JSON payloads.
