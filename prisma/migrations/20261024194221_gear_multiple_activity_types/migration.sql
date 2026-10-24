-- CreateTable
CREATE TABLE "GearToTrackActivityTypes" (
    "gearId" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GearToTrackActivityTypes_pkey" PRIMARY KEY ("gearId","activityTypeId")
);

-- CreateIndex
CREATE INDEX "GearToTrackActivityTypes_activityTypeId_idx" ON "GearToTrackActivityTypes"("activityTypeId");

-- AddForeignKey
ALTER TABLE "GearToTrackActivityTypes" ADD CONSTRAINT "GearToTrackActivityTypes_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "Gear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearToTrackActivityTypes" ADD CONSTRAINT "GearToTrackActivityTypes_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "TrackActivityType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry the single activity type of the existing gear rows over into the join
-- table before the old column goes away, so nothing an owner already created
-- loses its classification.
INSERT INTO "GearToTrackActivityTypes" ("gearId", "activityTypeId", "assignedAt")
SELECT "id", "activityTypeId", CURRENT_TIMESTAMP FROM "Gear" WHERE "activityTypeId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Gear" DROP CONSTRAINT "Gear_activityTypeId_fkey";

-- DropIndex
DROP INDEX "Gear_activityTypeId_idx";

-- AlterTable
ALTER TABLE "Gear" DROP COLUMN "activityTypeId";
