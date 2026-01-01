import { PageLayout } from "@/components/layout/page-layout";
import { getLatestBlogPosts } from "../_data";
import { PostsSection } from "@/components/index";

const BlogPage = async () => {
  const posts = await getLatestBlogPosts(10);

  return (
    <PageLayout title="BlogPage">
      <PostsSection posts={posts} />
    </PageLayout>
  );
};

export default BlogPage;
