-- Add User.trustLevel and TrustChangeLog
CREATE TYPE "UserTrustLevel" AS ENUM ('NEW', 'VERIFIED', 'TRUSTED', 'RESTRICTED');

CREATE TYPE "TrustChangeSource" AS ENUM (
  'SYSTEM_INIT',
  'OAUTH_SIGNUP',
  'EMAIL_VERIFIED',
  'ADMIN_MANUAL',
  'AUTO_PROMOTION',
  'ADMIN_REVERT'
);

-- AddUserColumn
ALTER TABLE "user" ADD COLUMN "trustLevel" "UserTrustLevel" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "TrustChangeLog" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "fromLevel" "UserTrustLevel" NOT NULL,
    "toLevel" "UserTrustLevel" NOT NULL,
    "source" "TrustChangeSource" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrustChangeLog_targetUserId_createdAt_idx" ON "TrustChangeLog"("targetUserId", "createdAt");
CREATE INDEX "TrustChangeLog_actorUserId_createdAt_idx" ON "TrustChangeLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "TrustChangeLog" ADD CONSTRAINT "TrustChangeLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustChangeLog" ADD CONSTRAINT "TrustChangeLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing users with a verified email OR an OAuth Account (google/github) are VERIFIED.
-- The rest stay at the NEW default. No TrustChangeLog rows are written for the backfill.
UPDATE "user"
   SET "trustLevel" = 'VERIFIED'
 WHERE "emailVerified" = true
    OR EXISTS (
      SELECT 1 FROM "account"
       WHERE "account"."userId" = "user"."id"
         AND "account"."providerId" IN ('google', 'github')
    );