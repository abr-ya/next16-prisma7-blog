-- AlterTable
-- This migration was generated while applying the tracks feature, but it only
-- captures pre-existing drift for ContentTag.updatedAt default alignment.
ALTER TABLE "ContentTag" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
