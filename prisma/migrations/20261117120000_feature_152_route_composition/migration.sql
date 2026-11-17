-- CreateEnum
CREATE TYPE "RouteSegmentRole" AS ENUM ('START', 'MAIN', 'END');

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "isPart" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RouteComposition" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "staleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSegment" (
    "id" TEXT NOT NULL,
    "compositionId" TEXT NOT NULL,
    "childRouteId" TEXT NOT NULL,
    "role" "RouteSegmentRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "lapCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteComposition_routeId_key" ON "RouteComposition"("routeId");

-- CreateIndex
CREATE INDEX "RouteSegment_childRouteId_idx" ON "RouteSegment"("childRouteId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteSegment_compositionId_sortOrder_key" ON "RouteSegment"("compositionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "RouteComposition" ADD CONSTRAINT "RouteComposition_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSegment" ADD CONSTRAINT "RouteSegment_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "RouteComposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSegment" ADD CONSTRAINT "RouteSegment_childRouteId_fkey" FOREIGN KEY ("childRouteId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
