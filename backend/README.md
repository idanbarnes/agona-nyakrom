# Agona Nyakrom Backend

## Overview

Node.js/Express API powering the Agona Nyakrom website. It serves public content
(news, obituaries, clans, Asafo companies, hall of fame, homepage/global settings)
and provides admin endpoints for managing data, authentication, and media uploads.

## Tech Stack

- Node.js + Express
- PostgreSQL
- Knex (migrations)
- JWT (auth)
- Multer with Sharp (uploads/media processing)

## Folder Structure

- `server.js`: app entry point; registers routes and starts the server.
- `knexfile.js`: Knex configuration (PostgreSQL connection and migrations).
- `migrations/`: database schema changes (Knex). Example: admins table with UUIDs.
- `src/`: application code (controllers, routes, services, models, middleware, utils, config).
- `uploads/`: uploaded media storage (used by file upload middleware).
- `.env`: runtime environment variables (not committed).
- `.env.example`: environment variable template.

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy `.env.example` to `.env`
- Fill in database credentials and secrets:
  - `PORT`
  - `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `DB_SSL=true` for hosted Postgres such as Neon
  - `JWT_SECRET`
  - `PREVIEW_TOKEN_SECRET` (recommended; falls back to `JWT_SECRET` if omitted)
  - `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`

3. Database & migrations

- Ensure PostgreSQL is running and the database exists.
- Run migrations with the package script:

```bash
npm run migrate
```

4. Start the server

```bash
npm run dev
```

## Scripts

- `npm run dev`: run migrations and start the API server locally.
- `npm run start:prod`: run migrations and start the API in production.
- `npm run start:render`: Render-friendly production start command.
- `npm run build:render`: Render-friendly backend build command.
- `npm run migrate`: run the latest Knex migrations.
- `npm run seed:admin`: seed an initial admin user (script exists).
- `npm test`: placeholder (no tests configured).

## Render Deployment

For Render web services, use:

- Root Directory: `backend`
- Build Command: `npm run build:render`
- Start Command: `npm run start:render`
- Health Check Path: `/api/health`

Required Render environment variables:

- `NODE_ENV=production`
- `DATABASE_URL`
- `DB_SSL=true`
- `JWT_SECRET`
- `PREVIEW_TOKEN_SECRET`

If `MEDIA_STORAGE=cloudinary`, you must also set:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## API

Base URL (local): `http://localhost:5000`

Example route groups (from `server.js`):

- `GET /api/health`
- `GET /api/news`, `GET /api/obituaries`, `GET /api/clans`
- `GET /api/asafo-companies`, `GET /api/landmarks`, `GET /api/hall-of-fame`
- `GET /api/public/news`, `GET /api/public/obituaries`, `GET /api/public/homepage`
- `POST /api/admin/auth/*` (admin authentication)
- `GET /api/admin/*` (admin management endpoints)

TODO: add specific endpoint details per route file if needed.

## Uploads / Media

Uploaded files are stored in `uploads/`. Configure limits with `UPLOAD_DIR` and
`MAX_FILE_SIZE_MB`.

## Troubleshooting

- Missing `.env`: copy `.env.example` and set values.
- Render does not read your local `.env`; configure environment variables in the Render dashboard.
- DB connection errors on Render: confirm `DATABASE_URL` is set on the Render service and `DB_SSL=true`.
- JWT startup errors on Render: confirm `JWT_SECRET` is set in the Render Environment panel and is not still the placeholder value.
- Migration errors: ensure the database exists and run `npm run migrate`.

## License

TODO: add license.

## Author

TODO: add author.
