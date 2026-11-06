# Implementation status — continued migration

## Code prepared
All business services use the shared database client. PostgreSQL URLs select the separately generated PostgreSQL client; file URLs keep the preserved SQLite client for development. Production refuses SQLite and requires POSTGRES_CUTOVER_APPROVED=true. This is a deployment gate, not evidence of readiness.

The PostgreSQL application schema preserves API UUIDs in my_due. The public reference schema maps the 24 supplied tables, their scalar types, foreign keys and unique constraints. These are two DIFFERENT schemas. Public users/events are NOT automatically visible in my_due. LegacyIdentityMap preserves bigint-to-UUID identity but has not been populated. This design is a candidate requiring schema and data-mapping approval, not a completed in-place mapping of existing public tables.

Registration, authentication, user administration, events, workflow, bookings, handover, finance, reports, notifications and audit all select the same client. No individual module intentionally stays on SQLite when PostgreSQL is selected. Current local .env still selects SQLite. No live PostgreSQL read/write tests have run.

Booking availability checks and writes run in Serializable transactions with bounded P2034 retries. A separate draft exclusion constraint covers all booking write paths. Workflow already commits state/history/decision/audit together with optimistic version checks. Password reset update and token consumption are in one transaction. Concurrency integration tests remain required.

CORS uses the configured comma-separated origins. Production requires JWT_SECRET and CORS_ORIGIN. Authentication reads the current database role rather than trusting an outdated role in an existing token.

## Frontend audit
EventContext reads business records from the API and refreshes every five seconds and on focus; successful mutations wait for the backend. Legacy localStorage import is explicit and preserves originals. AuthContext still contains demo role switching and mock allUsers; audit usages before disabling these features. No UI changes made in this phase.

## Vercel candidate and storage blocker
backend/src/vercel.ts exports Express without listening. backend/vercel.example.json is a candidate for a backend-root Vercel project; it is intentionally not active deployment configuration. A clean CI build must generate the PostgreSQL client before Functions packaging; generated engine files must be traced/included. No deployment tested.

Current attachment routes use local disk. Do NOT deploy them on ephemeral Functions as durable storage. Minimum viable alternative: keep Express on a persistent server with a backed-up upload volume, use Supabase for PostgreSQL and Vercel for frontend. Preferred future Functions path: private Supabase Storage bucket, server-side upload, authenticated download/signed URL, preserve old attachment paths until copied and verified. Existing download route authorization also needs review before exposing private objects.

## Environment and release
Server: DATABASE_URL (runtime pooler, schema=my_due), DIRECT_URL (administration), JWT_SECRET (retain existing), CORS_ORIGIN, POSTGRES_CUTOVER_APPROVED (false until verified). SUPABASE_INSPECT_URL should use a read-only account. Preview/Development must use independent databases; none is currently configured. Frontend VITE_API_URL is only the HTTPS API base URL, never credentials. Same-origin /api needs a verified rewrite to the chosen backend.

After explicit approval, commands from backend for the reviewed drafts are:

```powershell
# Do not run until live introspection, backup and approval.
npx prisma db execute --url "$env:DIRECT_URL" --file ../database/SUPABASE_COMPATIBILITY_DRAFT.sql
npx prisma db execute --url "$env:DIRECT_URL" --file ../database/SUPABASE_BOOKING_CONSTRAINT_DRAFT.sql
```

These drafts create compatibility tables and constraints, NOT a data migration. A separately reviewed import must reconcile verified email, existing password hash formats, roles, state codes, bigint/UUID mappings and every dependent record before cutover. Never assume Username=email. Do not enable the production gate while tables are empty.

Backup: take a consistent database backup and upload backup; verify a restore into an isolated environment and record row counts/constraints. Rollback: previous application plus untouched SQLite remains available, but production writes made after cutover must be reconciled before reverting. Leave additive tables intact; never drop them as automatic rollback.

## Verification limits
No migration, seed, delete, deploy or production write performed. OneDrive deletion alert remains unexplained. Build/generate are suspended; only noEmit typecheck, source review and diff checks are allowed in this phase. Live schema, RLS, data reconciliation, concurrency, cross-device persistence and Functions deployment remain unverified.


## Latest implementation — private storage and reviewed import
- Added storage.service.ts: private-bucket verification, server-side upload with no overwrite, bounded file size and signature checks, short-lived signed downloads, and safe legacy local path resolution. Files are not deleted automatically if metadata persistence fails; orphan reconciliation is a separate task. Office ZIP signature checking is not malware scanning.
- Attachment routes now authenticate downloads and check event/attachment linkage. Upload requires event owner or ADMIN. Read access follows the existing application policy allowing authenticated roles to view events. Removed the unauthenticated /uploads static route. Frontend sends bearer headers for downloads; visual markup/styles are preserved.
- Added executable import-reviewed-data.cjs. Default dry-run validates reviewed mappings; --apply-test accepts only explicitly confirmed loopback my_due_test_* PostgreSQL databases. All inserts and ID mappings commit in one transaction; no overwrite or automatic deletion. Manifest source IDs must be decimal strings. The manifest must list parents before children and supply correct target scalar fields. Existing foreign keys validate relationships at insertion. Domain-specific mappings still require the real source data and verified email/role/state decisions; this engine is not an automatic migration of all 24 tables.
- Added SUPABASE_SOURCE_ARCHIVE.sql to preserve each original row (including Username, password hash and unmapped fields). Access restricted to backend database roles. This SQL is not applied.
- backend/vercel.json and vercel-build now prepare a backend-root Node 22 deployment, include the generated PostgreSQL client, and route /api requests to Express. Vercel deployment is still untested. STORAGE_DRIVER=supabase is required on Vercel. File limit is capped at 4 MB to fit the Functions request limit; larger legacy files require download testing or a direct signed transfer design.
- Additional server variables: STORAGE_DRIVER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET. Bucket must already exist and be private. Never expose the service-role key to frontend. Production bucket creation has not been performed.
- User management no longer falls back to mock users when the API returns an empty list or an error. Demo role switching is disabled in Production. Original localStorage recovery data remains untouched.
- Unit tests: storage.test.ts uses mocked HTTP and import-reviewed-data.test.cjs validates identity precision and failure conditions. These tests do not establish live Supabase connectivity.
- No PostgreSQL test server, psql/docker executable or Supabase credentials were found in the inspected environment. Live DB, bucket, migration, role/RLS and persistence checks remain blocked.
- Isolated build copy: C:\Projects\event_manage_verify_c378fc14. Source and data files were copied and SHA-256 verified; original OneDrive source/database/uploads were not moved or deleted. The copy contains local configuration/data and should be treated as private.

### Reviewed manifest format
Use a private, untracked file. Each record has sourceTable, sourceId (decimal string), source (full original row), targetModel and data (explicit Prisma scalar values). Foreign IDs use {"$ref":{"table":"Users","id":"123"}}. User mappings additionally require emailVerified=true and roleVerified=true, verified email/role, and an unchanged bcrypt passwordHash. No example real users or credentials are included. Existing incompatible hashes halt the import instead of silently assigning passwords. Review roles/states and all missing required target fields before applying to an isolated test database.

Commands (not executed against a DB):
```
node scripts/import-reviewed-data.cjs <private-reviewed-manifest.json>
# Only after provisioning a verified local test database and applying reviewed schema files there:
node scripts/import-reviewed-data.cjs <private-reviewed-manifest.json> --apply-test
```
Production transfer has no automatic apply command in this tool. Prepare and approve the concrete data diff after test reconciliation, backup and restore rehearsal.


### Verified results for this iteration
- Isolated `npm run build:postgres`: PASS (Prisma 5.22 generated successfully, backend TypeScript passed).
- Isolated frontend `npm run build`: PASS after adding vite-env.d.ts. Vite reports a bundle-size warning, not a build failure.
- Storage unit tests: 2 PASS, HTTP mocked; no real storage request made.
- Mapping unit tests: 2 PASS; no database connection or write made.
- `git diff --check`: PASS. No tracked deletions reported.
- PostgreSQL integration, actual data migration, bucket integration, restart/redeploy persistence and Vercel deployment: NOT RUN, missing test database and credentials.
- Existing local Git remote matches https://github.com/yentien06-pixel/event_manage.git; public browser fetch returned 404, so remote source/deployment state was not independently verified.

### Files changed in this iteration
Backend: src/services/storage.service.ts, src/routes/event.routes.ts, src/app.ts, src/config/index.ts, src/vercel.ts, vercel.json, package.json, package-lock.json, .env.postgresql.example; scripts/inspect-supabase.cjs, scripts/storage.test.ts, scripts/import-reviewed-data.cjs, scripts/import-reviewed-data.test.cjs.
Frontend data access only: src/services/api.ts, src/pages/EventDetailPage.tsx, src/pages/UserManagementPage.tsx, src/contexts/AuthContext.tsx, src/vite-env.d.ts. LoginPage changes predate this iteration and were preserved.
Database: SUPABASE_SOURCE_ARCHIVE.sql and this status document. Prior draft schema/constraint SQL remains unapplied.
