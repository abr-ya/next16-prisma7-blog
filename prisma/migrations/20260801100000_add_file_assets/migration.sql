-- CreateEnum
CREATE TYPE "FileAssetProvider" AS ENUM ('UPLOADTHING');

-- CreateEnum
CREATE TYPE "FileAssetPurpose" AS ENUM ('ADMIN_UPLOAD', 'ARCHIVE_ATTACHMENT', 'VIDEO_ATTACHMENT', 'PREVIEW_IMAGE', 'RICH_TEXT_IMAGE', 'STANDALONE_SHARED_FILE');

-- CreateEnum
CREATE TYPE "FileAssetVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileAssetStatus" AS ENUM ('ACTIVE', 'DETACHED', 'PENDING_DELETE', 'DELETED');

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "provider" "FileAssetProvider" NOT NULL DEFAULT 'UPLOADTHING',
    "fileKey" TEXT NOT NULL,
    "customId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "purpose" "FileAssetPurpose" NOT NULL DEFAULT 'ADMIN_UPLOAD',
    "visibility" "FileAssetVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "FileAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_fileKey_key" ON "FileAsset"("fileKey");

-- CreateIndex
CREATE INDEX "FileAsset_ownerUserId_status_idx" ON "FileAsset"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "FileAsset_purpose_idx" ON "FileAsset"("purpose");

-- CreateIndex
CREATE INDEX "FileAsset_visibility_idx" ON "FileAsset"("visibility");

-- CreateIndex
CREATE INDEX "FileAsset_uploadedAt_idx" ON "FileAsset"("uploadedAt");

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
