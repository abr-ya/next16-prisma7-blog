-- CreateEnum
CREATE TYPE "TrackTimeSource" AS ENUM ('GPX', 'MANUAL', 'NONE');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "recordingDurationSeconds" INTEGER,
ADD COLUMN     "recordingStartAt" TIMESTAMP(3),
ADD COLUMN     "timeSource" "TrackTimeSource";

-- CreateIndex
CREATE INDEX "Track_timeSource_idx" ON "Track"("timeSource");

-- Backfill: every pre-existing track came from a GPX upload (no other creation
-- path existed before this migration), so classify them all as 'GPX'.
UPDATE "Track" SET "timeSource" = 'GPX' WHERE "timeSource" IS NULL;
