-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "photoId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_photoId_createdAt_idx" ON "Comment"("photoId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_photoId_idx" ON "Comment"("userId", "photoId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnforceSingleTarget: every Comment must reference exactly one of videoId or photoId.
-- Existing rows all have videoId non-null and photoId null, so they satisfy the constraint automatically.
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_single_target_chk" CHECK (("videoId" IS NULL) <> ("photoId" IS NULL));
