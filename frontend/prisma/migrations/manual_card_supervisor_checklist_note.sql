-- Optional per-task supervisor + checklist item notes
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "supervisorId" TEXT;

CREATE INDEX IF NOT EXISTS "cards_supervisorId_idx" ON "cards"("supervisorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cards_supervisorId_fkey'
  ) THEN
    ALTER TABLE "cards"
      ADD CONSTRAINT "cards_supervisorId_fkey"
      FOREIGN KEY ("supervisorId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "description" TEXT;
