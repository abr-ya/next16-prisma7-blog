CREATE TYPE "PhotoStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TYPE "FileAssetPurpose" ADD VALUE 'OUTDOOR_PHOTO_IMAGE';

CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PhotoStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhotoImage" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Photo_status_idx" ON "Photo"("status");

CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

CREATE INDEX "Photo_updatedAt_idx" ON "Photo"("updatedAt");

CREATE UNIQUE INDEX "PhotoImage_fileAssetId_key" ON "PhotoImage"("fileAssetId");

CREATE UNIQUE INDEX "PhotoImage_photoId_sortOrder_key" ON "PhotoImage"("photoId", "sortOrder");

CREATE INDEX "PhotoImage_photoId_idx" ON "PhotoImage"("photoId");

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhotoImage" ADD CONSTRAINT "PhotoImage_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhotoImage" ADD CONSTRAINT "PhotoImage_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
