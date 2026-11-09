-- feature-141: a draft workout may exist before its geometry does.
CREATE TYPE "TrackGeometryState" AS ENUM ('PENDING', 'READY');

ALTER TABLE "Track" ADD COLUMN     "geometryState" "TrackGeometryState" NOT NULL DEFAULT 'READY',
ADD COLUMN     "privateNote" TEXT;

-- A PENDING draft stores no geometry; a READY track keeps exactly one source.
ALTER TABLE "Track" DROP CONSTRAINT "Track_geometry_source_check";
ALTER TABLE "Track" ADD CONSTRAINT "Track_geometry_source_check" CHECK (
    ("geometryState" = 'PENDING' AND "routeId" IS NULL AND "fileAssetId" IS NULL AND "metadata" IS NULL)
    OR
    ("geometryState" = 'READY' AND (
        ("routeId" IS NULL AND "fileAssetId" IS NOT NULL)
        OR
        ("routeId" IS NOT NULL AND "fileAssetId" IS NULL AND "metadata" IS NULL)
    ))
);

-- A pending draft cannot be published.
ALTER TABLE "Track" ADD CONSTRAINT "Track_publish_requires_geometry_check" CHECK (
    "status" <> 'PUBLISHED' OR "geometryState" = 'READY'
);
