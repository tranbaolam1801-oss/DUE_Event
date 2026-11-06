-- DRAFT ONLY: not applied. Requires live schema review and explicit approval.
-- Creates isolated application tables; does NOT migrate or expose public legacy rows.
-- No existing table or password hash is modified. Do not deploy before data reconciliation.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "my_due";

-- CreateTable
CREATE TABLE "my_due"."User" (
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "my_due"."Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "my_due"."ResourceBookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceBookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "my_due"."SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_due"."PasswordResetToken" (
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

-- CreateTable
CREATE TABLE "my_due"."LegacyIdentityMap" (
    "entity" TEXT NOT NULL,
    "legacyId" BIGINT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "LegacyIdentityMap_pkey" PRIMARY KEY ("entity","legacyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "my_due"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventCode_key" ON "my_due"."Event"("eventCode");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_code_key" ON "my_due"."Facility"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "my_due"."Equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EventReport_eventId_key" ON "my_due"."EventReport"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "my_due"."SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "my_due"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyIdentityMap_entity_applicationId_key" ON "my_due"."LegacyIdentityMap"("entity", "applicationId");

-- AddForeignKey
ALTER TABLE "my_due"."Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."EventVersion" ADD CONSTRAINT "EventVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."EventScheduleItem" ADD CONSTRAINT "EventScheduleItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."BudgetItem" ADD CONSTRAINT "BudgetItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Attachment" ADD CONSTRAINT "Attachment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ResourceBooking" ADD CONSTRAINT "ResourceBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ResourceBooking" ADD CONSTRAINT "ResourceBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "my_due"."Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ResourceBookingItem" ADD CONSTRAINT "ResourceBookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "my_due"."ResourceBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ResourceBookingItem" ADD CONSTRAINT "ResourceBookingItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "my_due"."Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_handoverById_fkey" FOREIGN KEY ("handoverById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."HandoverRecord" ADD CONSTRAINT "HandoverRecord_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ReturnInspection" ADD CONSTRAINT "ReturnInspection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."ReturnInspection" ADD CONSTRAINT "ReturnInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."IncidentReport" ADD CONSTRAINT "IncidentReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."IncidentReport" ADD CONSTRAINT "IncidentReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Settlement" ADD CONSTRAINT "Settlement_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."SettlementItem" ADD CONSTRAINT "SettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "my_due"."Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."FinancialDocument" ADD CONSTRAINT "FinancialDocument_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "my_due"."Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."EventReport" ADD CONSTRAINT "EventReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_due"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "my_due"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_due"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_due"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "my_due"."User" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Event" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."EventVersion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."EventScheduleItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."BudgetItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."ApprovalDecision" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."WorkflowHistory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Attachment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Facility" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Equipment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."ResourceBooking" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."ResourceBookingItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."HandoverRecord" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."ReturnInspection" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."IncidentReport" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Settlement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."SettlementItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."FinancialDocument" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."EventReport" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."Notification" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."AuditLog" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."SystemSetting" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."PasswordResetToken" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "my_due"."LegacyIdentityMap" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA "my_due" FROM PUBLIC;
COMMIT;
