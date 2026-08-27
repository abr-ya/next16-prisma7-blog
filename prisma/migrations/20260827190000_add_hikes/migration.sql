CREATE TYPE "HikeStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "HikeType" AS ENUM ('HIKING', 'MOUNTAIN', 'WATER', 'SKI', 'BIKE', 'OTHER');

CREATE TABLE "Hike" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "HikeType" NOT NULL,
    "status" "HikeStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Hike_slug_key" ON "Hike"("slug");

CREATE INDEX "Hike_status_idx" ON "Hike"("status");

CREATE INDEX "Hike_startDate_endDate_idx" ON "Hike"("startDate", "endDate");

CREATE INDEX "Hike_userId_idx" ON "Hike"("userId");

ALTER TABLE "Hike" ADD CONSTRAINT "Hike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
