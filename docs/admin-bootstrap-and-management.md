# Admin Bootstrap And Management

## First Admin

Use the public bootstrap endpoint once:

- Route: `POST /api/admin/auth/bootstrap`
- Body:

```json
{
  "bootstrap_token": "your-bootstrap-token",
  "name": "Main Admin",
  "email": "admin@example.com",
  "password": "ReplaceWithAStrongPassword123!"
}
```

Rules:
- `ADMIN_BOOTSTRAP_TOKEN` must be set on the backend.
- By default, bootstrap only works before the first admin exists.
- If you really need to reopen bootstrap later, set `ALLOW_ADMIN_BOOTSTRAP_WHEN_ADMINS_EXIST=true` temporarily, use it once, then turn it off again.

## Create Admins After Login

Use the authenticated backend route:

- Route: `POST /api/admin/users`
- Auth: `Bearer <admin-jwt>`
- Body:

```json
{
  "name": "Another Admin",
  "email": "another-admin@example.com",
  "password": "AnotherStrongPassword123!"
}
```

## List Existing Admins

- Route: `GET /api/admin/users`
- Auth: `Bearer <admin-jwt>`

## Shell Command Alternative

Use this when you have terminal access to the backend instance:

```bash
cd backend
npm run admin:create -- --name "Main Admin" --email admin@example.com --password "ReplaceWithAStrongPassword123!"
```
