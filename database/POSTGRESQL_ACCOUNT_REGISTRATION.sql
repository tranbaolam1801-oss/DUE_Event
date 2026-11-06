-- EventFlow account registration support for the current Prisma PostgreSQL schema.
-- Run in Supabase SQL Editor or psql against the database used by the Render backend.
-- This is additive: it does not drop or rewrite existing tables or account data.
-- The backend must use schema=my_due and the matching schema.postgresql.prisma client.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE SCHEMA IF NOT EXISTS "my_due";

CREATE TABLE IF NOT EXISTS "my_due"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "my_due"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "otpHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
    ON "my_due"."User" ("email");

-- Registration normalizes email to lowercase; this also prevents case-only duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key"
    ON "my_due"."User" (lower("email"));

CREATE INDEX IF NOT EXISTS "User_phone_idx"
    ON "my_due"."User" ("phone")
    WHERE "phone" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key"
    ON "my_due"."PasswordResetToken" ("token");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_status_createdAt_idx"
    ON "my_due"."PasswordResetToken" ("email", "used", "verified", "createdAt" DESC);

COMMIT;

-- Verify table and index creation:
-- SELECT table_schema, table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'my_due'
--   AND table_name IN ('User', 'PasswordResetToken')
-- ORDER BY table_name;
--
-- SELECT indexname
-- FROM pg_indexes
-- WHERE schemaname = 'my_due'
--   AND tablename IN ('User', 'PasswordResetToken')
-- ORDER BY tablename, indexname;
