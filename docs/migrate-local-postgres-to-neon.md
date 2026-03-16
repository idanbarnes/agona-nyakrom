# Migrate Local Postgres Data To Neon

This project now includes a one-time copy script that moves your existing local Postgres data into Neon.

It does not just run migrations. It copies table rows from your local database into the Neon database configured in `backend/.env`.

## How It Works

- Source database:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
- Target database:
  - `DATABASE_URL`

## Before You Run It

Make sure `backend/.env` still contains:

```env
DATABASE_URL=your_neon_connection_string
DB_SSL=true

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_local_database
DB_USER=postgres
DB_PASSWORD=your_local_password
```

Then make sure Neon already has the schema:

```powershell
cd backend
npm run migrate
```

## Run The Copy

```powershell
cd backend
npm run migrate:local-to-neon
```

## What The Script Does

- connects to your local Postgres database as the source
- connects to Neon as the target
- truncates target tables in Neon
- copies rows from local Postgres to Neon in dependency-safe order
- resets target sequences after import

## Important

- This replaces the current application tables in Neon with the local data.
- Run it only when you are sure your local database is the source of truth.
- After it completes, restart the backend and log in using the admin accounts that existed in your local Postgres database.
