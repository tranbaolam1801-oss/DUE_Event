# Supabase migration — inspection and approval gate

## Verified locally
- Active Node backend uses Prisma 5.22.0 with SQLite, not SQL Server.
- Supabase SQL file creates 24 tables in public with quoted PascalCase names.
- This script is evidence of intended schema only; live Supabase schema/data have not been inspected.
- Users.UserId and Events.EventId are bigint identity; application models use UUID strings. BigInt needs explicit API serialization.
- Application User.email, failedLoginAttempts, lockedUntil and PasswordResetToken have no equivalent in the supplied Users schema. Username must not be assumed to contain email.
- Roles/departments are relational in the SQL script, while application stores role/department strings.
- EventVersion, EventScheduleItem, ReturnInspection, IncidentReport, Settlement, SettlementItem, SystemSetting and PasswordResetToken do not have direct equivalent tables in the supplied script.
- Frontend API defaults to /api; VITE_API_URL can override it. AuthContext still imports mock users; EventContext retains local legacy records as a recovery source. These need a separate behavior audit before claiming server-only persistence.
- No root vercel.json was found. Actual Vercel deployment settings and environment scopes are unverified.
- Express serves local uploads; durable attachment storage must be resolved before moving uploads to ephemeral Functions.

## Proposed sequence (no database writes performed)
1. Obtain read-only access to existing Supabase schema and Vercel configuration. Compare tables, columns, defaults, constraints, indexes, triggers, RLS and row counts. Never log connection strings or password hashes.
2. Confirm whether Username is email, identify existing password hash algorithm and role mappings, and determine intended mappings for missing application fields.
3. Produce an explicit additive schema diff for functionality that cannot be mapped, preserving existing IDs and data. Review API DTO conversion from bigint/decimal/timestamps. Do not just change the Prisma provider.
4. Before approving DDL, take a Supabase backup/snapshot, export schema, verify restoration into an isolated test database, and record table counts and constraints.
5. After approval, implement Prisma PostgreSQL mappings and repositories, preserving authentication, role checks, workflow transactions and booking concurrency rules. Generate client during build. Keep production secrets server-side.
6. Baseline only after comparing the live schema and migration history. Review SQL before applying; do not use reset, destructive push or overwrite seed.
7. Run registration/login/event/workflow/booking/finance tests against isolated test data. Verify persistence across sessions and process restarts. Production write tests are not authorized.
8. Review serverless routes, CORS and persistent file storage; deploy only after separate authorization.

## Rollback plan to finalize with the approved DDL
Keep previous application artifact and database snapshot. Prefer reverting code with additive schema left intact. Never drop new columns/tables after users have written data. Restore a backup only after assessing newer writes and obtaining explicit approval; rehearse restore on an isolated database first.

## Environment scope proposal (not yet verified on Vercel)
- DATABASE_URL: server-only runtime connection to the target database. Production uses production; Preview/Development use isolated non-production databases.
- DIRECT_URL: optional administration connection if the final Prisma schema uses directUrl; do not configure blindly before choosing connection mode.
- JWT_SECRET: retain the working secret and existing authentication semantics.
- CORS_ORIGIN: actual frontend origin; current app uses a wildcard directly and must be reviewed.
- VITE_API_URL: public API base URL only, never a database URL or service-role key; omit for same-origin /api.
- Existing mail/AI settings and durable upload settings require deployment review.

## Pending approval and evidence
Need secure access to the existing Supabase connection/schema and actual Vercel configuration, plus approval of a concrete additive DDL plan after schema inspection. No credentials should be pasted into chat. No application provider switch, migration, seed, deployment or database write has been performed.
