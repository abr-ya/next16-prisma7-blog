import { Breadcrumbs, BlogPostForm } from "@/components/index";
import { BlogPost as IBlogPost } from "@/generated/prisma/client";

const BlogPostPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("BlogPostPage, id: ", id);

  let post: Omit<IBlogPost, "createdAt" | "updatedAt"> = {
    id: "",
    title: "",
    description: null,
    content: "",
    slug: "",
  };

  if (id !== "new") {
    const { getBlogPostById } = await import("@/app/_data/blogPosts");
    const fetchedPost = await getBlogPostById(id);
    if (fetchedPost) {
      post = fetchedPost;
    }
  }

  const breadcrumbItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "MD Posts", to: "/md-posts" },
    { label: post.title || "New", to: null },
  ];

  return (
    <>
      <div className="flex flex-col p-8">
        <div className="flex w-full justify-between">
          <Breadcrumbs data={breadcrumbItems} />
        </div>
      </div>

      <div className="p-8 flex flex-col">
        <BlogPostForm
          id={post.id}
          title={post.title}
          description={post.description || ""}
          content={post.content}
          slug={post.slug}
        />
      </div>
    </>
  );
};

export default BlogPostPage;
