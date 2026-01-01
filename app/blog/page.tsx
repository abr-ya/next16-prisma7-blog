import { PageLayout } from "@/components/layout/page-layout";
import { getLatestPosts } from "../_data";
import { PostsSection } from "@/components/index";

const BlogPage = async () => {
  const posts = await getLatestPosts(10);

  return (
    <PageLayout title="BlogPage">
      <PostsSection posts={posts} />
    </PageLayout>
  );
};

export default BlogPage;
