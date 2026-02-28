# Contact CMS API

This module follows the existing Agona Nyakrom backend response contract:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "..."
}
```

## Public endpoints

Base URL: `/api/public`

- `GET /contact` - Fetch contact info (title, subtitle, emails, phones, address, office_hours)
- `GET /faqs` - Fetch active FAQs ordered by `display_order`
- `GET /contact/sections` - Fetch combined `{ contact, faqs }`

Versioned aliases:

- `GET /api/v1/contact`
- `GET /api/v1/faqs`
- `GET /api/v1/contact/sections`

## Admin endpoints

Base URL: `/api/admin` (JWT required)

### Authentication

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/profile`

Versioned auth aliases:

- `POST /api/v1/admin/login`
- `POST /api/v1/admin/logout`
- `GET /api/v1/admin/profile`

### Contact management

- `GET /contact`
- `PUT /contact`
- `PATCH /contact/emails`
- `PATCH /contact/phones`
- `PATCH /contact/address`
- `PATCH /contact/hours`

Versioned aliases:

- `GET /api/v1/admin/contact`
- `PUT /api/v1/admin/contact`
- `PATCH /api/v1/admin/contact/emails`
- `PATCH /api/v1/admin/contact/phones`
- `PATCH /api/v1/admin/contact/address`
- `PATCH /api/v1/admin/contact/hours`

### FAQ management

- `GET /faqs`
- `POST /faqs`
- `GET /faqs/:id`
- `PUT /faqs/:id`
- `DELETE /faqs/:id`
- `POST /faqs/reorder` (body: `{ "items": [{"id":"...","display_order":1}] }`)
- `PATCH /faqs/:id/toggle`
- `POST /faqs/bulk` (body: `{ "action": "activate|deactivate|delete", "ids": ["..."] }`)
- `POST /faqs/bulk-delete` (body: `{ "ids": ["..."] }`)
- `POST /faqs/bulk-activate` (body: `{ "ids": ["..."] }`)
- `POST /faqs/bulk-deactivate` (body: `{ "ids": ["..."] }`)

Compatibility aliases used by the FAQ manager UI:

- `GET /api/faqs/admin?search=&status=all|published|draft&page=&limit=`
- `POST /api/faqs`
- `PUT /api/faqs/:id`
- `DELETE /api/faqs/:id`
- `PATCH /api/faqs/reorder`
- `PATCH /api/faqs/:id/toggle`
- `POST /api/faqs/bulk-delete`
- `POST /api/faqs/bulk-activate`
- `POST /api/faqs/bulk-deactivate`

Versioned aliases:

- `GET /api/v1/admin/faqs`
- `POST /api/v1/admin/faqs`
- `GET /api/v1/admin/faqs/:id`
- `PUT /api/v1/admin/faqs/:id`
- `DELETE /api/v1/admin/faqs/:id`
- `POST /api/v1/admin/faqs/reorder`
- `PATCH /api/v1/admin/faqs/:id/toggle`

## Security and behavior

- Admin routes use `requireAdminAuth` JWT middleware.
- Login attempts are rate-limited in memory.
- Configurable env vars:
  - `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS` (default `900000`)
  - `ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS` (default `5`)
