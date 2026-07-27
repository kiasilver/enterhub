-- Delay incidents, extension requests, schedule change audit
-- Run if prisma migrate/db push fails with EPERM while the server holds the engine.

DO $$ BEGIN
  CREATE TYPE "ExtensionUnit" AS ENUM ('HOURS', 'DAYS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExtensionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScheduleChangeSource" AS ENUM ('EXTENSION_APPROVED', 'MANAGER_ADJUST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DelayIncidentStatus" AS ENUM ('OPEN', 'CHARGED', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "card_extension_requests" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "unit" "ExtensionUnit" NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ExtensionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "proposedDueDate" TIMESTAMP(3),
  "proposedEstimatedHours" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "card_extension_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "card_schedule_changes" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "changedById" TEXT NOT NULL,
  "source" "ScheduleChangeSource" NOT NULL,
  "prevDueDate" TIMESTAMP(3),
  "newDueDate" TIMESTAMP(3),
  "prevEstimatedHours" DOUBLE PRECISION,
  "newEstimatedHours" DOUBLE PRECISION,
  "addedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "addedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reason" TEXT NOT NULL,
  "extensionRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_schedule_changes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "card_delay_incidents" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" "DelayIncidentStatus" NOT NULL DEFAULT 'OPEN',
  "overdueAt" TIMESTAMP(3) NOT NULL,
  "daysLate" DOUBLE PRECISION,
  "chargedAt" TIMESTAMP(3),
  "chargedById" TEXT,
  "waivedAt" TIMESTAMP(3),
  "waivedById" TEXT,
  "waiveReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "card_delay_incidents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "card_schedule_changes_extensionRequestId_key"
  ON "card_schedule_changes"("extensionRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "card_delay_incidents_cardId_key"
  ON "card_delay_incidents"("cardId");

CREATE INDEX IF NOT EXISTS "card_extension_requests_cardId_status_idx"
  ON "card_extension_requests"("cardId", "status");
CREATE INDEX IF NOT EXISTS "card_extension_requests_workspaceId_status_idx"
  ON "card_extension_requests"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "card_extension_requests_requestedById_createdAt_idx"
  ON "card_extension_requests"("requestedById", "createdAt");

CREATE INDEX IF NOT EXISTS "card_schedule_changes_cardId_createdAt_idx"
  ON "card_schedule_changes"("cardId", "createdAt");
CREATE INDEX IF NOT EXISTS "card_schedule_changes_workspaceId_createdAt_idx"
  ON "card_schedule_changes"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "card_schedule_changes_changedById_createdAt_idx"
  ON "card_schedule_changes"("changedById", "createdAt");

CREATE INDEX IF NOT EXISTS "card_delay_incidents_workspaceId_employeeId_status_idx"
  ON "card_delay_incidents"("workspaceId", "employeeId", "status");
CREATE INDEX IF NOT EXISTS "card_delay_incidents_workspaceId_status_overdueAt_idx"
  ON "card_delay_incidents"("workspaceId", "status", "overdueAt");

DO $$ BEGIN
  ALTER TABLE "card_extension_requests"
    ADD CONSTRAINT "card_extension_requests_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_extension_requests"
    ADD CONSTRAINT "card_extension_requests_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_extension_requests"
    ADD CONSTRAINT "card_extension_requests_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_extension_requests"
    ADD CONSTRAINT "card_extension_requests_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "card_schedule_changes"
    ADD CONSTRAINT "card_schedule_changes_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_schedule_changes"
    ADD CONSTRAINT "card_schedule_changes_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_schedule_changes"
    ADD CONSTRAINT "card_schedule_changes_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_schedule_changes"
    ADD CONSTRAINT "card_schedule_changes_extensionRequestId_fkey"
    FOREIGN KEY ("extensionRequestId") REFERENCES "card_extension_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "card_delay_incidents"
    ADD CONSTRAINT "card_delay_incidents_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_delay_incidents"
    ADD CONSTRAINT "card_delay_incidents_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_delay_incidents"
    ADD CONSTRAINT "card_delay_incidents_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_delay_incidents"
    ADD CONSTRAINT "card_delay_incidents_chargedById_fkey"
    FOREIGN KEY ("chargedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "card_delay_incidents"
    ADD CONSTRAINT "card_delay_incidents_waivedById_fkey"
    FOREIGN KEY ("waivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
