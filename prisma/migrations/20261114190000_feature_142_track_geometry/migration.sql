-- feature-142: track-owned GPX files kept as secondary geometry while a
-- route supplies the primary map and distance. The exactly-one-primary-source
-- check on "Track" is unchanged; this table stores only non-primary files.

-- CreateTable
CREATE TABLE "TrackGeometry" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackGeometry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackGeometry_fileAssetId_key" ON "TrackGeometry"("fileAssetId");

-- CreateIndex
CREATE INDEX "TrackGeometry_trackId_idx" ON "TrackGeometry"("trackId");

-- AddForeignKey
ALTER TABLE "TrackGeometry" ADD CONSTRAINT "TrackGeometry_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackGeometry" ADD CONSTRAINT "TrackGeometry_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
