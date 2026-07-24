-- CreateTable
CREATE TABLE "VideoBookmark" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoBookmark_userId_videoId_timestampSeconds_idx" ON "VideoBookmark"("userId", "videoId", "timestampSeconds");

-- CreateIndex
CREATE INDEX "VideoBookmark_videoId_idx" ON "VideoBookmark"("videoId");

-- AddForeignKey
ALTER TABLE "VideoBookmark" ADD CONSTRAINT "VideoBookmark_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoBookmark" ADD CONSTRAINT "VideoBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
