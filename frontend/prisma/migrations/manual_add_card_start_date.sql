-- Add due-window start for task date ranges
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
