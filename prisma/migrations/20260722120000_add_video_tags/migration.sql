-- Add reusable video tags and video/tag assignments.
CREATE TABLE "VideoTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VideosToVideoTags" (
    "videoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideosToVideoTags_pkey" PRIMARY KEY ("videoId", "tagId")
);

CREATE UNIQUE INDEX "VideoTag_slug_key" ON "VideoTag"("slug");

CREATE INDEX "VideoTag_name_idx" ON "VideoTag"("name");

CREATE INDEX "VideosToVideoTags_tagId_idx" ON "VideosToVideoTags"("tagId");

ALTER TABLE "VideosToVideoTags" ADD CONSTRAINT "VideosToVideoTags_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VideosToVideoTags" ADD CONSTRAINT "VideosToVideoTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "VideoTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
