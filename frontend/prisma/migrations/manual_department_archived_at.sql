-- Soft-disable departments
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "departments_workspaceId_archivedAt_idx" ON "departments"("workspaceId", "archivedAt");
