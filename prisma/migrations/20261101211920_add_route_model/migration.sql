-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileAssetId" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_fileAssetId_key" ON "Route"("fileAssetId");

-- CreateIndex
CREATE INDEX "Route_userId_idx" ON "Route"("userId");

-- AlterTable
ALTER TABLE "Track" ADD COLUMN "routeId" TEXT;

-- AlterTable
ALTER TABLE "Track" ALTER COLUMN "fileAssetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- feature-127: convert the three legacy map-placed tracks into routes. The
-- track rows are kept: ids, slugs, recording data, and HikesToTracks links
-- stay valid, and the geometry (file + metadata) moves to the new route.
INSERT INTO "Route" ("id", "title", "description", "fileAssetId", "metadata", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."title", t."description", t."fileAssetId", t."metadata", t."userId", t."createdAt", t."updatedAt"
FROM "Track" t
WHERE t."slug" IN (
    'po-nahimova-do-metro-sprava',
    'na-primorskuyu-cherez-osenniy-marafon',
    'nabahino-na-stanciyu'
)
AND t."fileAssetId" IS NOT NULL;

-- feature-127: link each converted track to its route.
UPDATE "Track" t
SET "routeId" = r."id"
FROM "Route" r
WHERE r."fileAssetId" = t."fileAssetId"
AND t."routeId" IS NULL;

-- feature-127: a route-based track keeps no geometry of its own.
UPDATE "Track"
SET "fileAssetId" = NULL,
    "metadata" = NULL
WHERE "routeId" IS NOT NULL;

-- feature-127: exactly one geometry source per track.
ALTER TABLE "Track" ADD CONSTRAINT "Track_geometry_source_check" CHECK (
    ("routeId" IS NULL AND "fileAssetId" IS NOT NULL)
    OR
    ("routeId" IS NOT NULL AND "fileAssetId" IS NULL AND "metadata" IS NULL)
);
