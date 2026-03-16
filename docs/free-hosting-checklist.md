# Free Hosting Plan

## Chosen Stack

- Hosting platform: Render
- Database: Neon Postgres
- Image storage: Cloudinary

## Chosen Render Service Names

- Public site: `agonanyakrom`
- Admin site: `agonanyakrom-admin`
- Backend API: `agonanyakrom-api`

These names drive the example domains used in the repo:

- `https://agonanyakrom.onrender.com`
- `https://agonanyakrom-admin.onrender.com`
- `https://agonanyakrom-api.onrender.com`

If Render says any of these names are unavailable, rename the service and update the matching env example files.

This is the closest zero-monthly-cost stack that fits this project after the backend changes in this repo.

Important caveat:

- Render free web services are hobby-grade and may spin down after inactivity. This is acceptable for a first launch on a zero budget, but it is not the same as a paid production SLA.

## Backend Environment Variables

Set these on the Render backend service:

```env
NODE_ENV=production
TRUST_PROXY=true
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=replace-with-a-long-random-secret
PREVIEW_TOKEN_SECRET=replace-with-a-different-long-random-secret
JWT_EXPIRES_IN=1d
PUBLIC_SITE_URL=https://agonanyakrom.onrender.com
ADMIN_SITE_URL=https://agonanyakrom-admin.onrender.com
PUBLIC_ASSET_BASE_URL=https://agonanyakrom-api.onrender.com
PUBLIC_SHARE_IMAGE_URL=https://agonanyakrom.onrender.com/share-default.svg
CORS_ALLOWED_ORIGINS=https://agonanyakrom.onrender.com,https://agonanyakrom-admin.onrender.com
ADMIN_BOOTSTRAP_TOKEN=replace-with-a-one-time-bootstrap-token
ALLOW_ADMIN_BOOTSTRAP_WHEN_ADMINS_EXIST=false
ADMIN_PASSWORD_MIN_LENGTH=10
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_BASE_FOLDER=agonanyakrom
```

Notes:

- `DATABASE_URL` comes from Neon.
- `MEDIA_STORAGE=cloudinary` removes the free-hosting dependency on local disk uploads.
- Change the `.onrender.com` domains to your real custom domains later if you add them.
- The same values are already prepared in [backend/.env.render.example](/C:/agona-nyakrom/backend/.env.render.example).

## Public Frontend Environment Variables

Set these on the Render public static site:

```env
VITE_API_BASE_URL=https://agonanyakrom-api.onrender.com
```

This value is prepared in [public-frontend/.env.production.example](/C:/agona-nyakrom/public-frontend/.env.production.example).

## Admin Frontend Environment Variables

Set these on the Render admin static site:

```env
VITE_API_BASE_URL=https://agonanyakrom-api.onrender.com
VITE_PUBLIC_SITE_URL=https://agonanyakrom.onrender.com
```

These values are prepared in [admin-frontend/.env.production.example](/C:/agona-nyakrom/admin-frontend/.env.production.example).

## Render Setup

### Backend Web Service

Create a new Render Web Service from this repo with:

- Root Directory: `backend`
- Build Command: `npm run build:render`
- Start Command: `npm run start:render`
- Health Check Path: `/api/health`
- Instance Type: `Free`

Why these scripts:

- `npm run build:render` installs backend dependencies in the backend root.
- `npm run start:render` runs migrations and then starts the API in one step.
- Render's free web services do not support a separate pre-deploy command, so the migration must stay in the start path.

### Public Static Site

Create a new Render Static Site from this repo with:

- Root Directory: `public-frontend`
- Build Command: `npm run build:render`
- Publish Directory: `dist`

Add a rewrite rule for the SPA:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

### Admin Static Site

Create a new Render Static Site from this repo with:

- Root Directory: `admin-frontend`
- Build Command: `npm run build:render`
- Publish Directory: `dist`

Add the same SPA rewrite rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

## Neon Setup

Create a Neon project and copy the pooled connection string into the backend `DATABASE_URL`.

Use:

```env
DB_SSL=true
```

because hosted Postgres usually requires SSL.

## Cloudinary Setup

Create a Cloudinary account and copy these values into the backend service:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

All uploaded media will then be stored remotely instead of on the Render instance filesystem.

## Deployment Commands

Push the cleaned repo after committing:

```bash
git add .
git commit -m "Prepare free hosting and admin bootstrap"
git push origin main
```

Render will auto-deploy from the connected branch after the services are created.

## Admin Bootstrap

After the backend is live, create the first admin with a one-time bootstrap token.

PowerShell example:

```powershell
$body = @{
  bootstrap_token = "replace-with-your-bootstrap-token"
  name = "Main Admin"
  email = "admin@example.com"
  password = "ReplaceWithAStrongPassword123!"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://agonanyakrom-api.onrender.com/api/admin/auth/bootstrap" `
  -ContentType "application/json" `
  -Body $body
```

The response includes a JWT token and the created admin profile.

You can also use the script already added to the repo:

```powershell
.\scripts\bootstrap-first-admin.ps1 `
  -BootstrapToken "replace-with-your-bootstrap-token" `
  -Name "Main Admin" `
  -Email "admin@example.com" `
  -Password "ReplaceWithAStrongPassword123!"
```

## Create More Admin Users

After you log in with the first admin, create more admins from the backend API.

PowerShell example:

```powershell
$token = "paste-admin-jwt-here"
$body = @{
  name = "Editor Admin"
  email = "editor@example.com"
  password = "AnotherStrongPassword123!"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://agonanyakrom-api.onrender.com/api/admin/users" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

You can also list admins:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "https://agonanyakrom-api.onrender.com/api/admin/users" `
  -Headers @{ Authorization = "Bearer $token" }
```

## Server-Side Admin Creation Command

If you have shell access to the backend host, you can create an admin directly:

```bash
cd backend
npm run admin:create -- --name "Main Admin" --email admin@example.com --password "ReplaceWithAStrongPassword123!"
```
