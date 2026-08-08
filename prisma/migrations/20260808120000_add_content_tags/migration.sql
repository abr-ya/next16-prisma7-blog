-- Add shared content tags and post/tag assignments (posts only).
CREATE TABLE "ContentTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostsToContentTags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostsToContentTags_pkey" PRIMARY KEY ("postId", "tagId")
);

CREATE UNIQUE INDEX "ContentTag_slug_key" ON "ContentTag"("slug");

CREATE INDEX "ContentTag_name_idx" ON "ContentTag"("name");

CREATE INDEX "PostsToContentTags_tagId_idx" ON "PostsToContentTags"("tagId");

ALTER TABLE "PostsToContentTags" ADD CONSTRAINT "PostsToContentTags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostsToContentTags" ADD CONSTRAINT "PostsToContentTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
