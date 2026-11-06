# Deploy QLQTKD to Vercel and Supabase

## Deployment layout

Use two Vercel projects so the static Vite frontend is served by Vercel's CDN and the Express backend runs as a Vercel Function:

1. **Frontend project**: set Vercel's Root Directory to `frontend`. Its `vercel.json` requires `VITE_API_URL`, builds `dist`, and falls back to `index.html` for SPA routes.
2. **Backend project**: set Root Directory to `backend`. Its `vercel.json` uses the Express framework preset; `src/app.ts` exports the Express app and does not open a listening socket. Vercel serves `/api/*` through the function. `express.static()` is not used to serve the frontend.

The root `server.ts` remains the integrated localhost development server and is not the Vercel entry point. The backend build generates the PostgreSQL Prisma client before deployment. `vercel` works through `npx`; it is not a runtime dependency.

## Supabase project setup

1. Create a Supabase project at [https://supabase.com/dashboard](https://supabase.com/dashboard), choose a region near Vietnam if available, and set a unique database password.
2. In **Project Settings → Database → Connect**, copy the PostgreSQL connection strings. Do not confuse these with the Project URL or API keys.
3. Use the **Transaction pooler** connection (port `6543`) for `DATABASE_URL`, and add `pgbouncer=true`, `schema=my_due`, and `sslmode=require`.
4. Use the **Session pooler** connection (port `5432`) for `DIRECT_URL`; use it only for Prisma migrations and one-time data migration. Add `schema=my_due` and `sslmode=require`.
5. URL-encode special characters in the database password. Never paste connection strings or keys into chat or source files.
6. Create a **private** Supabase Storage bucket named `event-attachments-private` (or set another bucket name consistently). Do not enable public access for finance documents.

The backend uses only the PostgreSQL connection strings for Prisma. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used only by the backend's private Storage client; never set the service-role key as a `VITE_*` variable.

## Database migration safety

There are no Prisma migration history files in the prior project state. The checked-in `20261107000000_init_postgres` migration is generated from `schema.postgresql.prisma` and creates the `my_due` schema and all 24 application tables. It contains no `DROP` statements and is intended only for a new, empty application schema.

Do **not** run it against a database with existing application tables. The repository also contains `database/MIGRATE_MY_DUE_PRISMA_SCHEMA.sql`, an additive preflight migration for a specific existing schema inventory. That SQL is not proof of the current Supabase schema. Introspect and back up the actual target first; if its schema differs, prepare and review a migration against that exact database before applying anything.

After confirming a new project has no application tables in `my_due`, run from `backend`:

```powershell
npm run db:migrate:status
npm run db:migrate:deploy
```

For SQLite-to-PostgreSQL data transfer, first run a read-only count report from `backend`:

```powershell
npm run db:migrate:sqlite-to-postgres
```

The transfer script copies IDs, password hashes, roles, and relations without seeding or deleting data. It requires an already-migrated target schema, checks that every target application table is empty, and wraps inserts in one PostgreSQL transaction. Only after a verified backup and an explicitly confirmed empty target may the operator use:

```powershell
$env:SOURCE_DATABASE_URL = "file:./dev.db"
$env:CONFIRM_SQLITE_TO_POSTGRES_MIGRATION = "I_HAVE_BACKUP_AND_TARGET_IS_EMPTY"
npm run db:migrate:sqlite-to-postgres -- --apply
```

Set `DIRECT_URL` in the backend shell before applying. This operation has not been run against Supabase. If production already has users, events, or other application rows, do not use this empty-target importer; review and reconcile existing rows first.

## Vercel environment variables

Create separate Vercel projects and add variables to the appropriate project and environment:

| Project  | Variable                    | Value                                                                                          |
| -------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| Backend  | `DATABASE_URL`              | Supabase Transaction pooler URL (6543)                                                         |
| Backend  | `DIRECT_URL`                | Supabase Session pooler URL (5432)                                                             |
| Backend  | `JWT_SECRET`                | Random secret generated privately, at least 32 random bytes                                    |
| Backend  | `NODE_ENV`                  | `production`                                                                                   |
| Backend  | `CORS_ORIGIN`               | Exact HTTPS frontend production domain; comma-separated exact branch-preview domains as needed |
| Backend  | `STORAGE_DRIVER`            | `supabase`                                                                                     |
| Backend  | `SUPABASE_URL`              | Supabase Project URL (`https://<project-ref>.supabase.co`)                                     |
| Backend  | `SUPABASE_SERVICE_ROLE_KEY` | Server-only secret key from Supabase; never expose to frontend                                 |
| Backend  | `SUPABASE_STORAGE_BUCKET`   | Private bucket name                                                                            |
| Frontend | `VITE_API_URL`              | Backend deployment URL plus `/api`, e.g. `https://<backend-project>.vercel.app/api`            |

Use a separate non-production Supabase project/database for Preview. Configure its connection strings in Vercel's Preview environment; never point Preview at Production. Set the preview frontend origin in the backend Preview `CORS_ORIGIN`.

Generate a JWT secret without sending it anywhere:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Add backend secrets under **Vercel → Backend Project → Settings → Environment Variables** and the public API URL under the frontend project. Redeploy after changing variables. The checked-in `.env.example` files contain placeholders only.

## CLI and build

The verified local CLI is Vercel CLI `65.12.1` (current minimum for Express is `47.0.5`). Sign in using the official flow, then link each project from its directory:

```powershell
npx vercel login
Set-Location frontend
npx vercel
Set-Location ..\backend
npx vercel
```

Deployments must wait until the Supabase project, secrets, database schema, and private storage bucket are configured and verified. Do not use `--prod` until the preview deployment and database have passed checks.

Local validation commands:

```powershell
npm run build
npm --prefix frontend run build:vercel # set VITE_API_URL to the HTTPS backend /api URL first
npm --prefix backend run build:postgres
npm --prefix backend run typecheck
```

## Current verification boundary

The PostgreSQL Prisma client and backend TypeScript build have been checked locally, and the migration SQL was generated from the PostgreSQL schema. The Vercel CLI is available. No Supabase project credentials or Vercel account deployment were provided, so this workspace has not connected to a live PostgreSQL database, applied migrations, created a Storage bucket, or deployed a Preview/Production site. Those steps must be verified before claiming deployment readiness.
