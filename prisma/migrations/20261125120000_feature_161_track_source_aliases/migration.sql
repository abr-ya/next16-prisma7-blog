-- CreateEnum
CREATE TYPE "TrackSourceAliasKind" AS ENUM ('APP', 'DEVICE');

-- CreateTable
CREATE TABLE "TrackSourceAlias" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "TrackSourceAliasKind" NOT NULL,
    "rawValue" TEXT NOT NULL,
    "rawKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackSourceAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackSourceAlias_userId_idx" ON "TrackSourceAlias"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackSourceAlias_userId_kind_rawKey_key" ON "TrackSourceAlias"("userId", "kind", "rawKey");

-- AddForeignKey
ALTER TABLE "TrackSourceAlias" ADD CONSTRAINT "TrackSourceAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
