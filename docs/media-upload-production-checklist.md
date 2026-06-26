# Media Upload Production Checklist

Complete this before deploying a hosted production runtime.

## Required Environment

- `NODE_ENV=production`
- `MEDIA_STORAGE=cloudinary`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_BASE_FOLDER=agonanyakrom`
- `SITE_URL` set to the final HTTPS public origin
- `PUBLIC_ASSET_BASE_URL` set to the unified origin unless there is a separate asset origin

Do not set `ALLOW_PRODUCTION_LOCAL_UPLOADS=true` unless production has durable disk storage and the risk has been explicitly accepted.

## Cloudinary Setup

1. Create a Cloudinary account.
2. Copy the cloud name, API key, and API secret into the backend environment.
3. Choose the base folder, normally `agonanyakrom`.
4. Start the app and confirm startup fails clearly if any Cloudinary credential is missing.

## Legacy Media

- Keep `/uploads` routing enabled for legacy local references.
- Confirm `/uploads/<known-file>` returns the legacy file when that file exists.
- Confirm `/uploads/tmp/<file>` returns 404.
- Confirm Cloudinary absolute URLs render without rewriting.

## Upload Safety

- Verify JPEG, PNG, and WebP uploads succeed through admin forms.
- Verify unsupported file types are rejected.
- Verify files over 5 MB are rejected.
- Verify failed uploads do not create incomplete content records in the relevant admin flow.
- Verify image replacement preserves existing records when a new upload fails.

## Migration Readiness

Before changing database records from local upload paths to Cloudinary URLs:

1. Back up the database.
2. Confirm the local `backend/uploads` directory contains the files referenced by the database.
3. Run the mandatory dry run:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary -- --dry-run
```

4. Review every missing file and every proposed update.
5. Execute only after review:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary -- --execute
```

The migration does not delete local files.

## Verification Commands

Run:

```powershell
npm --prefix backend test
npm --prefix public-frontend run lint
npm --prefix admin-frontend run lint
npm run build:unified
npm run start:unified
```

Then manually verify:

- public pages render local and Cloudinary images
- admin upload fields still create and replace images
- `/uploads` legacy files are reachable
- `/uploads/tmp` is not reachable
- SEO/social image metadata does not contain admin, API, preview, or tmp upload paths
