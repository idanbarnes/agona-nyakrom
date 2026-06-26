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
4. in dry-run mode, reports the database values that would change
5. in execute mode only, uploads files and updates matching database values to the new Cloudinary `https://...` URLs

It also scans JSON/JSONB columns, so homepage block image references are included.

The script does not delete local files.

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

Dry-run is mandatory before execution. Run this first:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary -- --dry-run
```

This shows what would be updated without changing Neon or uploading files to Cloudinary. Review every proposed update and every missing local file before continuing.

## Real Migration

If the dry run looks correct:

```powershell
cd C:\agona-nyakrom\backend
npm run migrate:uploads-to-cloudinary -- --execute
```

A plain command without `--execute` stays in dry-run mode.

## After Migration

1. redeploy the backend on Render
2. hard refresh both frontends
3. verify that old records now return Cloudinary URLs instead of `/uploads/...`
4. keep the local `backend/uploads` directory until public/admin verification is complete

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

## Rollback Limitations

The script rewrites database values when run with `--execute`. It does not keep a built-in rollback table and it does not delete local files. Rollback requires restoring a database backup or manually changing affected records back to their previous `/uploads/...` values.

Cloudinary uploads created during execution are not removed automatically during rollback.
