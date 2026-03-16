# Deploy Admin Frontend To Render Static Site

This admin frontend is ready to deploy to Render as a static site.

## Files Already Prepared

- `admin-frontend/package.json`
  - includes `npm run build:render`
- `admin-frontend/.env.production.example`
  - contains the required production frontend environment variables
- `render.yaml`
  - includes a Render static-site blueprint for the admin frontend
  - includes the SPA rewrite rule `/* -> /index.html`

## Required Environment Variables

Set these for the admin static site:

```env
VITE_API_BASE_URL=https://agonanyakrom-api.onrender.com
VITE_PUBLIC_SITE_URL=https://agonanyakrom.onrender.com
```

## Manual Render Settings

If you create the service manually in the Render dashboard, use:

- Service Type: `Static Site`
- Root Directory: `admin-frontend`
- Build Command: `npm run build:render`
- Publish Directory: `dist`

Then add this rewrite rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

This rewrite is required because the app uses React Router with `BrowserRouter`.

## Blueprint Option

You can also create or sync the service from the root `render.yaml` file.

That blueprint already includes:

- service name: `agonanyakrom-admin`
- runtime: `static`
- root directory: `admin-frontend`
- build command: `npm run build:render`
- publish path: `./admin-frontend/dist`
- SPA rewrite rule
