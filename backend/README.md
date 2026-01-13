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
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_SECRET`
  - `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`

3. Database & migrations

- Ensure PostgreSQL is running and the database exists.
- Run migrations with Knex CLI:

```bash
npx knex migrate:latest --env development
```

TODO: confirm preferred migration command or add a script to `package.json`.

4. Start the server

```bash
npm run dev
```

TODO: add a production start script if needed.

## Scripts

- `npm run dev`: start the API server (`server.js`).
- `npm run seed:admin`: seed an initial admin user (script exists).
- `npm test`: placeholder (no tests configured).

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
- DB connection errors: verify `DB_*` settings and PostgreSQL availability.
- Migration errors: ensure the database exists and run `npx knex migrate:latest`.

## License

TODO: add license.

## Author

TODO: add author.
