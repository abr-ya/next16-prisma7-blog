CREATE TYPE "TrackStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TYPE "FileAssetPurpose" ADD VALUE 'TRACK_GPX';

CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "TrackStatus" NOT NULL DEFAULT 'DRAFT',
    "fileAssetId" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");

CREATE UNIQUE INDEX "Track_fileAssetId_key" ON "Track"("fileAssetId");

CREATE INDEX "Track_status_idx" ON "Track"("status");

CREATE INDEX "Track_userId_idx" ON "Track"("userId");

ALTER TABLE "Track" ADD CONSTRAINT "Track_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
