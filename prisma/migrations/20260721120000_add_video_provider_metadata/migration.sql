-- Add nullable provider metadata fields to existing video records.
ALTER TABLE "Video"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "providerVideoId" TEXT,
  ADD COLUMN "embedUrl" TEXT,
  ADD COLUMN "durationSeconds" INTEGER;

CREATE INDEX "Video_provider_providerVideoId_idx" ON "Video"("provider", "providerVideoId");
