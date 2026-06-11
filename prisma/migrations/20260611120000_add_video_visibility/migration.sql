-- CreateEnum
CREATE TYPE "VideoVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN "visibility" "VideoVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE INDEX "Video_visibility_idx" ON "Video"("visibility");
