-- Additive PostgreSQL migration generated from backend/prisma/schema.postgresql.prisma.
-- Production inventory supplied by the operator: my_due currently contains User and PasswordResetToken only.
-- This migration validates and preserves those two tables, then creates the other Prisma models,
-- unique indexes, and foreign keys. It never reads/writes public legacy tables or copies legacy data.
-- Review and back up Supabase before running. No DROP, TRUNCATE, reset, RLS or grants are performed.
-- All DDL is transactional; any error aborts the transaction and leaves it unapplied.
-- Roll back before COMMIT by canceling the transaction. After COMMIT, do not drop tables;
-- use a reviewed forward migration so any subsequently written application data is preserved.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $preflight$
DECLARE
  actual_columns text[];
  expected_columns text[];
  column_spec record;
  index_spec record;
  actual_type text;
  actual_nullable text;
  actual_precision integer;
  existing_tables text[];
BEGIN
  IF to_regclass('"my_due"."User"') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: expected existing table my_due."User" was not found.';
  END IF;
  IF to_regclass('"my_due"."PasswordResetToken"') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: expected existing table my_due."PasswordResetToken" was not found.';
  END IF;

  SELECT array_agg(t.table_name ORDER BY t.table_name) INTO existing_tables
  FROM unnest(ARRAY[
    'Event','EventVersion','EventScheduleItem','BudgetItem','ApprovalDecision','WorkflowHistory',
    'Attachment','Facility','Equipment','ResourceBooking','ResourceBookingItem','HandoverRecord',
    'ReturnInspection','IncidentReport','Settlement','SettlementItem','FinancialDocument','EventReport',
    'Notification','AuditLog','SystemSetting','LegacyIdentityMap'
  ]) AS t(table_name)
  WHERE to_regclass(format('%I.%I','my_due',t.table_name)) IS NOT NULL;
  IF existing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Preflight failed: expected-new tables already exist in my_due: %',existing_tables;
  END IF;

  SELECT array_agg(column_name::text ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema='my_due' AND table_name='User';
  expected_columns := ARRAY['id','email','passwordHash','fullName','phone','role','department','isActive',
    'failedLoginAttempts','lockedUntil','createdAt','updatedAt'];
  IF (SELECT array_agg(column_name ORDER BY column_name) FROM unnest(actual_columns) AS columns(column_name))
     IS DISTINCT FROM
     (SELECT array_agg(column_name ORDER BY column_name) FROM unnest(expected_columns) AS columns(column_name)) THEN
    RAISE EXCEPTION 'Preflight failed: my_due."User" columns do not match Prisma schema. Actual: %', actual_columns;
  END IF;

  SELECT array_agg(column_name::text ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema='my_due' AND table_name='PasswordResetToken';
  expected_columns := ARRAY['id','email','token','otpHash','attempts','expiresAt','verified','used','createdAt'];
  IF (SELECT array_agg(column_name ORDER BY column_name) FROM unnest(actual_columns) AS columns(column_name))
     IS DISTINCT FROM
     (SELECT array_agg(column_name ORDER BY column_name) FROM unnest(expected_columns) AS columns(column_name)) THEN
    RAISE EXCEPTION 'Preflight failed: my_due."PasswordResetToken" columns do not match Prisma schema. Actual: %', actual_columns;
  END IF;

  FOR column_spec IN
    SELECT * FROM (VALUES
      ('User','id','text','NO',NULL), ('User','email','text','NO',NULL),
      ('User','passwordHash','text','NO',NULL), ('User','fullName','text','NO',NULL),
      ('User','phone','text','YES',NULL), ('User','role','text','NO',NULL),
      ('User','department','text','YES',NULL), ('User','isActive','bool','NO',NULL),
      ('User','failedLoginAttempts','int4','NO',NULL), ('User','lockedUntil','timestamp','YES',3),
      ('User','createdAt','timestamp','NO',3), ('User','updatedAt','timestamp','NO',3),
      ('PasswordResetToken','id','text','NO',NULL), ('PasswordResetToken','email','text','NO',NULL),
      ('PasswordResetToken','token','text','NO',NULL), ('PasswordResetToken','otpHash','text','YES',NULL),
      ('PasswordResetToken','attempts','int4','NO',NULL), ('PasswordResetToken','expiresAt','timestamp','NO',3),
      ('PasswordResetToken','verified','bool','NO',NULL), ('PasswordResetToken','used','bool','NO',NULL),
      ('PasswordResetToken','createdAt','timestamp','NO',3)
    ) AS required_columns(table_name,column_name,udt_name,is_nullable,datetime_precision)
  LOOP
    SELECT c.udt_name,c.is_nullable,c.datetime_precision INTO actual_type,actual_nullable,actual_precision
    FROM information_schema.columns c
    WHERE c.table_schema='my_due' AND c.table_name=column_spec.table_name
      AND c.column_name=column_spec.column_name;
    IF NOT FOUND OR actual_type IS DISTINCT FROM column_spec.udt_name
       OR actual_nullable IS DISTINCT FROM column_spec.is_nullable
       OR actual_precision IS DISTINCT FROM column_spec.datetime_precision THEN
      RAISE EXCEPTION 'Preflight failed: my_due."%"."%" must be type %, nullable=%, datetime_precision=%; found type %, nullable %, datetime_precision %.',
        column_spec.table_name,column_spec.column_name,column_spec.udt_name,column_spec.is_nullable,
        column_spec.datetime_precision,actual_type,actual_nullable,actual_precision;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid='"my_due"."User"'::regclass AND c.contype='p'
      AND (
        SELECT array_agg(a.attname::text ORDER BY key_column.ordinality)
        FROM unnest(c.conkey) WITH ORDINALITY AS key_column(attnum,ordinality)
        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=key_column.attnum
      )=ARRAY['id']::text[]
  ) THEN
    RAISE EXCEPTION 'Preflight failed: my_due."User" must have PRIMARY KEY (id).';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid='"my_due"."PasswordResetToken"'::regclass AND c.contype='p'
      AND (
        SELECT array_agg(a.attname::text ORDER BY key_column.ordinality)
        FROM unnest(c.conkey) WITH ORDINALITY AS key_column(attnum,ordinality)
        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=key_column.attnum
      )=ARRAY['id']::text[]
  ) THEN
    RAISE EXCEPTION 'Preflight failed: my_due."PasswordResetToken" must have PRIMARY KEY (id).';
  END IF;

  FOR index_spec IN
    SELECT * FROM (VALUES
      ('User','User_email_key','email'),
      ('PasswordResetToken','PasswordResetToken_token_key','token')
    ) AS expected_indexes(table_name,index_name,column_name)
  LOOP
    IF to_regclass(format('%I.%I','my_due',index_spec.index_name)) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM pg_class idx
         JOIN pg_namespace idx_ns ON idx_ns.oid=idx.relnamespace
         JOIN pg_index i ON i.indexrelid=idx.oid
         WHERE idx_ns.nspname='my_due' AND idx.relname=index_spec.index_name
           AND i.indrelid=to_regclass(format('%I.%I','my_due',index_spec.table_name))
           AND i.indisunique AND i.indisvalid AND i.indisready
           AND i.indnatts=1 AND i.indnkeyatts=1
           AND i.indexprs IS NULL AND i.indpred IS NULL
           AND (
             SELECT array_agg(a.attname::text ORDER BY key_column.ordinality)
             FROM unnest(i.indkey) WITH ORDINALITY AS key_column(attnum,ordinality)
             JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=key_column.attnum
           )=ARRAY[index_spec.column_name]::text[]
       ) THEN
      RAISE EXCEPTION 'Preflight failed: existing index my_due.% conflicts with the expected unique index on %.%',
        index_spec.index_name,index_spec.table_name,index_spec.column_name;
    END IF;
  END LOOP;
END $preflight$;

-- Prisma CreateSchema
CREATE SCHEMA IF NOT EXISTS "my_due";

-- Prisma CreateTable
CREATE TABLE "my_due"."Event" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "targetAudience" TEXT,
    "expectedAttendees" INTEGER,
    "organizingUnit" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "setupTime" TIMESTAMP(3),
    "teardownTime" TIMESTAMP(3),
    "preferredVenue" TEXT,
    "planContent" TEXT,
    "safetyPlan" TEXT,
    "communicationPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "permitStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "facilityStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "inspectionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "settlementStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reportStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."EventVersion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "planContent" TEXT,
    "budgetData" TEXT,
    "changeNote" TEXT,
    "changedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventVersion_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."EventScheduleItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "responsible" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventScheduleItem_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."BudgetItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "actualQuantity" INTEGER,
    "actualPrice" DOUBLE PRECISION,
    "actualTotal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."ApprovalDecision" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "decidedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."WorkflowHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "comments" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."Attachment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."Facility" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "amenities" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."ResourceBooking" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "setupTime" TIMESTAMP(3),
    "teardownTime" TIMESTAMP(3),
    "expectedAttendees" INTEGER,
    "purpose" TEXT,
    "specialRequests" TEXT,
    "alternativeOption" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceBooking_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."ResourceBookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceBookingItem_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."HandoverRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "handoverById" TEXT NOT NULL,
    "receivedById" TEXT,
    "facilityCondition" TEXT,
    "equipmentList" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "handoverDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverRecord_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."ReturnInspection" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "inspectedById" TEXT NOT NULL,
    "facilityCondition" TEXT,
    "equipmentCondition" TEXT,
    "overallResult" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."IncidentReport" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "resolution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."Settlement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalBudgeted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difference" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."SettlementItem" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "budgetedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difference" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementItem_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."FinancialDocument" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."EventReport" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actualAttendees" INTEGER,
    "summary" TEXT,
    "achievements" TEXT,
    "challenges" TEXT,
    "lessonsLearned" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventReport_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- Prisma CreateTable
CREATE TABLE "my_due"."LegacyIdentityMap" (
    "entity" TEXT NOT NULL,
    "legacyId" BIGINT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "LegacyIdentityMap_pkey" PRIMARY KEY ("entity","legacyId")
);

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "my_due"."User"("email");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Event_eventCode_key" ON "my_due"."Event"("eventCode");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Facility_code_key" ON "my_due"."Facility"("code");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Equipment_code_key" ON "my_due"."Equipment"("code");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventReport_eventId_key" ON "my_due"."EventReport"("eventId");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "my_due"."SystemSetting"("key");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "my_due"."PasswordResetToken"("token");

-- Prisma CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LegacyIdentityMap_entity_applicationId_key" ON "my_due"."LegacyIdentityMap"("entity", "applicationId");

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Event"'::regclass AND conname='Event_createdById_fkey'
  ) THEN
    ALTER TABLE "my_due"."Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."EventVersion"'::regclass AND conname='EventVersion_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."EventVersion" ADD CONSTRAINT "EventVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."EventScheduleItem"'::regclass AND conname='EventScheduleItem_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."EventScheduleItem" ADD CONSTRAINT "EventScheduleItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."BudgetItem"'::regclass AND conname='BudgetItem_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."BudgetItem" ADD CONSTRAINT "BudgetItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ApprovalDecision"'::regclass AND conname='ApprovalDecision_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ApprovalDecision"'::regclass AND conname='ApprovalDecision_decidedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."WorkflowHistory"'::regclass AND conname='WorkflowHistory_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Attachment"'::regclass AND conname='Attachment_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."Attachment" ADD CONSTRAINT "Attachment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Attachment"'::regclass AND conname='Attachment_uploadedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ResourceBooking"'::regclass AND conname='ResourceBooking_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ResourceBooking" ADD CONSTRAINT "ResourceBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ResourceBooking"'::regclass AND conname='ResourceBooking_facilityId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ResourceBooking" ADD CONSTRAINT "ResourceBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "my_due"."Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ResourceBookingItem"'::regclass AND conname='ResourceBookingItem_bookingId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ResourceBookingItem" ADD CONSTRAINT "ResourceBookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "my_due"."ResourceBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ResourceBookingItem"'::regclass AND conname='ResourceBookingItem_equipmentId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ResourceBookingItem" ADD CONSTRAINT "ResourceBookingItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "my_due"."Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."HandoverRecord"'::regclass AND conname='HandoverRecord_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."HandoverRecord"'::regclass AND conname='HandoverRecord_handoverById_fkey'
  ) THEN
    ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_handoverById_fkey" FOREIGN KEY ("handoverById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."HandoverRecord"'::regclass AND conname='HandoverRecord_receivedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ReturnInspection"'::regclass AND conname='ReturnInspection_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."ReturnInspection" ADD CONSTRAINT "ReturnInspection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."ReturnInspection"'::regclass AND conname='ReturnInspection_inspectedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."ReturnInspection" ADD CONSTRAINT "ReturnInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."IncidentReport"'::regclass AND conname='IncidentReport_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."IncidentReport" ADD CONSTRAINT "IncidentReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."IncidentReport"'::regclass AND conname='IncidentReport_reportedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."IncidentReport" ADD CONSTRAINT "IncidentReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Settlement"'::regclass AND conname='Settlement_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Settlement"'::regclass AND conname='Settlement_submittedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Settlement"'::regclass AND conname='Settlement_reviewedById_fkey'
  ) THEN
    ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."SettlementItem"'::regclass AND conname='SettlementItem_settlementId_fkey'
  ) THEN
    ALTER TABLE "my_due"."SettlementItem" ADD CONSTRAINT "SettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "my_due"."Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."FinancialDocument"'::regclass AND conname='FinancialDocument_settlementId_fkey'
  ) THEN
    ALTER TABLE "my_due"."FinancialDocument" ADD CONSTRAINT "FinancialDocument_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "my_due"."Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."EventReport"'::regclass AND conname='EventReport_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."EventReport" ADD CONSTRAINT "EventReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Notification"'::regclass AND conname='Notification_userId_fkey'
  ) THEN
    ALTER TABLE "my_due"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."Notification"'::regclass AND conname='Notification_eventId_fkey'
  ) THEN
    ALTER TABLE "my_due"."Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Prisma AddForeignKey
DO $add_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='"my_due"."AuditLog"'::regclass AND conname='AuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "my_due"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $add_fk$;

-- Verify the application schema after migration. This does not inspect or modify public legacy tables.
DO $verify$
DECLARE
  expected_tables text[] := ARRAY[
    'User','Event','EventVersion','EventScheduleItem','BudgetItem','ApprovalDecision','WorkflowHistory',
    'Attachment','Facility','Equipment','ResourceBooking','ResourceBookingItem','HandoverRecord',
    'ReturnInspection','IncidentReport','Settlement','SettlementItem','FinancialDocument','EventReport',
    'Notification','AuditLog','SystemSetting','PasswordResetToken','LegacyIdentityMap'
  ];
  missing_tables text[];
  missing_foreign_keys text[];
  missing_indexes text[];
BEGIN
  SELECT array_agg(t.table_name ORDER BY t.table_name) INTO missing_tables
  FROM unnest(expected_tables) AS t(table_name)
  WHERE to_regclass(format('%I.%I','my_due',t.table_name)) IS NULL;
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Post-migration verification failed; missing tables: %',missing_tables;
  END IF;
  SELECT array_agg(format('%s.%s',expected.table_name,expected.index_name)
                   ORDER BY expected.table_name,expected.index_name)
    INTO missing_indexes
  FROM (VALUES
    ('User','User_email_key',ARRAY['email']::text[]),
    ('Event','Event_eventCode_key',ARRAY['eventCode']::text[]),
    ('Facility','Facility_code_key',ARRAY['code']::text[]),
    ('Equipment','Equipment_code_key',ARRAY['code']::text[]),
    ('EventReport','EventReport_eventId_key',ARRAY['eventId']::text[]),
    ('SystemSetting','SystemSetting_key_key',ARRAY['key']::text[]),
    ('PasswordResetToken','PasswordResetToken_token_key',ARRAY['token']::text[]),
    ('LegacyIdentityMap','LegacyIdentityMap_entity_applicationId_key',ARRAY['entity','applicationId']::text[])
  ) AS expected(table_name,index_name,columns)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class idx
    JOIN pg_namespace idx_ns ON idx_ns.oid=idx.relnamespace
    JOIN pg_index i ON i.indexrelid=idx.oid
    WHERE idx_ns.nspname='my_due' AND idx.relname=expected.index_name
      AND i.indrelid=to_regclass(format('%I.%I','my_due',expected.table_name))
      AND i.indisunique AND i.indisvalid AND i.indisready
      AND i.indnatts=cardinality(expected.columns)
      AND i.indnkeyatts=cardinality(expected.columns)
      AND i.indexprs IS NULL AND i.indpred IS NULL
      AND (
        SELECT array_agg(a.attname::text ORDER BY key_column.ordinality)
        FROM unnest(i.indkey) WITH ORDINALITY AS key_column(attnum,ordinality)
        JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=key_column.attnum
      )=expected.columns
  );
  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'Post-migration verification failed; missing or invalid unique indexes: %',missing_indexes;
  END IF;
  SELECT array_agg(format('%s.%s',expected.table_name,expected.constraint_name)
                   ORDER BY expected.table_name,expected.constraint_name)
    INTO missing_foreign_keys
  FROM (VALUES
    ('Event','Event_createdById_fkey'), ('EventVersion','EventVersion_eventId_fkey'),
    ('EventScheduleItem','EventScheduleItem_eventId_fkey'), ('BudgetItem','BudgetItem_eventId_fkey'),
    ('ApprovalDecision','ApprovalDecision_eventId_fkey'), ('ApprovalDecision','ApprovalDecision_decidedById_fkey'),
    ('WorkflowHistory','WorkflowHistory_eventId_fkey'), ('Attachment','Attachment_eventId_fkey'),
    ('Attachment','Attachment_uploadedById_fkey'), ('ResourceBooking','ResourceBooking_eventId_fkey'),
    ('ResourceBooking','ResourceBooking_facilityId_fkey'), ('ResourceBookingItem','ResourceBookingItem_bookingId_fkey'),
    ('ResourceBookingItem','ResourceBookingItem_equipmentId_fkey'), ('HandoverRecord','HandoverRecord_eventId_fkey'),
    ('HandoverRecord','HandoverRecord_handoverById_fkey'), ('HandoverRecord','HandoverRecord_receivedById_fkey'),
    ('ReturnInspection','ReturnInspection_eventId_fkey'), ('ReturnInspection','ReturnInspection_inspectedById_fkey'),
    ('IncidentReport','IncidentReport_eventId_fkey'), ('IncidentReport','IncidentReport_reportedById_fkey'),
    ('Settlement','Settlement_eventId_fkey'), ('Settlement','Settlement_submittedById_fkey'),
    ('Settlement','Settlement_reviewedById_fkey'), ('SettlementItem','SettlementItem_settlementId_fkey'),
    ('FinancialDocument','FinancialDocument_settlementId_fkey'), ('EventReport','EventReport_eventId_fkey'),
    ('Notification','Notification_userId_fkey'), ('Notification','Notification_eventId_fkey'),
    ('AuditLog','AuditLog_userId_fkey')
  ) AS expected(table_name,constraint_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid=to_regclass(format('%I.%I','my_due',expected.table_name))
      AND c.conname=expected.constraint_name AND c.contype='f'
  );
  IF missing_foreign_keys IS NOT NULL THEN
    RAISE EXCEPTION 'Post-migration verification failed; missing foreign keys: %',missing_foreign_keys;
  END IF;
END $verify$;

COMMIT;
