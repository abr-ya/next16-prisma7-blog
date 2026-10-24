-- CreateEnum
CREATE TYPE "TrackKind" AS ENUM ('ROUTE', 'TRAINING');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "kind" "TrackKind" NOT NULL DEFAULT 'ROUTE';

-- CreateIndex
CREATE INDEX "Track_userId_kind_idx" ON "Track"("userId", "kind");
