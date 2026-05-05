import { PostsSection } from "@/components/blog-posts/posts-section";
import type { BlogPost } from "@/generated/prisma/client";
import { getBlogPostsLoadErrorMessage } from "@/lib/prisma-blog-load-error-message";
import { getLatestBlogPosts } from "@/app/_data/getBlogPosts";

export async function RecentDocuments() {
  let mdBlogPosts: BlogPost[] = [];
  let loadError: string | null = null;

  try {
    mdBlogPosts = await getLatestBlogPosts();
  } catch (error) {
    console.error("[HomePage] Failed to load latest blog posts:", error);
    loadError = getBlogPostsLoadErrorMessage(error);
  }

  return (
    <PostsSection
      posts={mdBlogPosts}
      loadError={loadError}
      showAllLink
      title="Recent Markdown Documents"
      className="py-10 px-4"
    />
  );
}
