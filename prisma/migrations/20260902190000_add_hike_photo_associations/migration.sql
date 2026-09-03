CREATE TABLE "HikesToPhotos" (
    "hikeId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HikesToPhotos_pkey" PRIMARY KEY ("hikeId","photoId")
);

CREATE UNIQUE INDEX "HikesToPhotos_hikeId_position_key" ON "HikesToPhotos"("hikeId", "position");

CREATE INDEX "HikesToPhotos_photoId_idx" ON "HikesToPhotos"("photoId");

ALTER TABLE "HikesToPhotos" ADD CONSTRAINT "HikesToPhotos_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HikesToPhotos" ADD CONSTRAINT "HikesToPhotos_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
