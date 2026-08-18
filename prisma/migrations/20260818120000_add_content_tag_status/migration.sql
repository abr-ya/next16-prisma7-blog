-- Add review status for shared content tags. Existing tags remain active.
CREATE TYPE "ContentTagStatus" AS ENUM ('ACTIVE', 'NEEDS_REVIEW');

ALTER TABLE "ContentTag"
ADD COLUMN "status" "ContentTagStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "ContentTag_status_idx" ON "ContentTag"("status");
