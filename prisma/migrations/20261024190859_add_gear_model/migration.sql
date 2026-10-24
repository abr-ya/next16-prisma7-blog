-- CreateTable
CREATE TABLE "Gear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activityTypeId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gear_userId_idx" ON "Gear"("userId");

-- CreateIndex
CREATE INDEX "Gear_activityTypeId_idx" ON "Gear"("activityTypeId");

-- AddForeignKey
ALTER TABLE "Gear" ADD CONSTRAINT "Gear_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "TrackActivityType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gear" ADD CONSTRAINT "Gear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
