# Deploy Public Frontend To Render Static Site

This public frontend is ready to deploy to Render as a static site.

## Files Already Prepared

- `public-frontend/package.json`
  - includes `npm run build:render`
- `public-frontend/.env.production.example`
  - contains the required production frontend environment variable
- `render.yaml`
  - includes a Render static-site blueprint for the public frontend
  - includes the SPA rewrite rule `/* -> /index.html`

## Required Environment Variables

Set this for the public static site:

```env
VITE_API_BASE_URL=https://agonanyakrom-api.onrender.com
```

## Manual Render Settings

If you create the service manually in the Render dashboard, use:

- Service Type: `Static Site`
- Root Directory: `public-frontend`
- Build Command: `npm run build:render`
- Publish Directory: `dist`

Then add this rewrite rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

This rewrite is required because the app uses React Router with `BrowserRouter`.

If you skip this rewrite, hard-refreshing nested routes such as `/about/who-we-are`
will return a 404 in production even though client-side navigation works.

If you still see a 404 after adding the rewrite, verify that your public domain is
attached to the Render static site for `public-frontend`, not the backend API service.

## Blueprint Option

You can also create or sync the service from the root `render.yaml` file.

That blueprint already includes:

- service name: `agonanyakrom`
- runtime: `static`
- root directory: `public-frontend`
- build command: `npm run build:render`
- publish path: `dist`
- SPA rewrite rule
