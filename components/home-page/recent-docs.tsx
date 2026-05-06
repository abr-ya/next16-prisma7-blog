import { PostsSection } from "@/components/docs/posts-section";
import type { MdDoc } from "@/generated/prisma/client";
import { getMdDocsLoadErrorMessage } from "@/lib/prisma-md-docs-load-error-message";
import { getLatestMdDocs } from "@/app/_data/getMdDocs";

export async function RecentDocuments() {
  let mdDocs: MdDoc[] = [];
  let loadError: string | null = null;

  try {
    mdDocs = await getLatestMdDocs();
  } catch (error) {
    console.error("[HomePage] Failed to load latest md docs:", error);
    loadError = getMdDocsLoadErrorMessage(error);
  }

  return (
    <PostsSection
      posts={mdDocs}
      loadError={loadError}
      showAllLink
      title="Recent Documents (Markdown)"
      className="py-10 px-4"
    />
  );
}
