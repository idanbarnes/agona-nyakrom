# Migrate Local Uploads To Cloudinary

This project already supports new uploads going directly to Cloudinary when:

```env
MEDIA_STORAGE=cloudinary
```

But that does not automatically move older files that were created locally during development.

If your database rows still contain values like:

- `/uploads/news/...`
- `uploads/clans/...`
- `http://localhost:5000/uploads/...`

then those images will not render on Render, because Render does not have your old local `backend/uploads` directory.

## What This Migration Does

The script:

1. reads your current Neon database
2. finds image-related columns that still point at local `uploads/...` files
3. uploads those files from your local `backend/uploads` directory to Cloudinary
4. updates the matching database values in Neon to the new Cloudinary `https://...` URLs

It also scans JSON/JSONB columns, so homepage block image references are included.

## Requirements

In [backend/.env](/C:/agona-nyakrom/backend/.env), make sure these are already set:

```env
DATABASE_URL=postgresql://...
DB_SSL=true
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Important:

- `DATABASE_URL` must point to Neon
- `MEDIA_STORAGE` must be `cloudinary`
- your old local files must still exist in `backend/uploads`

## Safe Dry Run

Run this first:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary -- --dry-run
```

This shows what would be updated without changing Neon.

## Real Migration

If the dry run looks correct:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary
```

## After Migration

1. redeploy the backend on Render
2. hard refresh both frontends
3. verify that old records now return Cloudinary URLs instead of `/uploads/...`

## How To Verify

Check a public API response in your browser or PowerShell.

Example:

```powershell
Invoke-RestMethod -Uri "https://agonanyakrom-api.onrender.com/api/public/news"
```

If migration succeeded, image fields should look like:

```text
https://res.cloudinary.com/...
```

not:

```text
/uploads/...
```
