-- CreateTable
CREATE TABLE "GearPreference" (
    "userId" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "gearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GearPreference_pkey" PRIMARY KEY ("userId","activityTypeId")
);

-- CreateIndex
CREATE INDEX "GearPreference_gearId_idx" ON "GearPreference"("gearId");

-- AddForeignKey
ALTER TABLE "GearPreference" ADD CONSTRAINT "GearPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearPreference" ADD CONSTRAINT "GearPreference_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "TrackActivityType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearPreference" ADD CONSTRAINT "GearPreference_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "Gear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
