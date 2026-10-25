-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "gearId" TEXT;

-- CreateIndex
CREATE INDEX "Track_gearId_idx" ON "Track"("gearId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "Gear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
