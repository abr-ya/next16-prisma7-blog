import { getPostBySlug } from "@/app/_data";
import { PageLayout, PostArticle } from "@/components/index";
import { notFound } from "next/navigation";

const BlogPostPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <PageLayout title={post.title}>
      <PostArticle data={post} />
    </PageLayout>
  );
};

export default BlogPostPage;
