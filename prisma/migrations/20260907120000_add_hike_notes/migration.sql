CREATE TYPE "HikeNoteStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "HikeNote" (
    "id" TEXT NOT NULL,
    "hikeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "dayKey" TEXT,
    "status" "HikeNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HikeNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HikeNote_hikeId_status_idx" ON "HikeNote"("hikeId", "status");
CREATE INDEX "HikeNote_hikeId_dayKey_idx" ON "HikeNote"("hikeId", "dayKey");

ALTER TABLE "HikeNote" ADD CONSTRAINT "HikeNote_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
