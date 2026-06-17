-- CreateEnum
CREATE TYPE "VideoChannelVisibility" AS ENUM ('PUBLIC', 'HIDDEN');

-- CreateTable
CREATE TABLE "VideoChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "visibility" "VideoChannelVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoChannel_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Video" ADD COLUMN "channelId" TEXT;

-- CreateIndex
CREATE INDEX "VideoChannel_visibility_idx" ON "VideoChannel"("visibility");

-- CreateIndex
CREATE INDEX "Video_channelId_idx" ON "Video"("channelId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "VideoChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
