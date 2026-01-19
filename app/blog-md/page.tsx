import { PageLayout } from "@/components/layout/page-layout";
import { getLatestBlogPosts } from "../_data";
import { PostsSection } from "@/components/index";

const MarkdownBlogPage = async () => {
  const posts = await getLatestBlogPosts(10);

  return (
    <PageLayout title="Markdown Blog Page">
      <PostsSection posts={posts} />
    </PageLayout>
  );
};

export default MarkdownBlogPage;
