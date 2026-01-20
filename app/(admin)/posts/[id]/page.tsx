import { Breadcrumbs, PostForm } from "@/components/index";
import { Post as IPost } from "@/generated/prisma/client";

const PostPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("PostPage, id: ", id);
  let post: Omit<IPost, "userId" | "views" | "createdAt" | "updatedAt"> = {
    id: "",
    title: "",
    content: "",
    imageUrl: "",
    categoryId: "",
    tags: [],
    status: "draft",
    slug: "",
  };

  if (id !== "new") {
    const { getPostById } = await import("@/app/_data/posts");
    post = await getPostById(id);
  }

  const breadcrumbItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Posts", to: "/posts" },
    { label: post.title || "New", to: null },
  ];

  const categories = [
    { id: "1", name: "FirstTestCategory" },
    { id: "2", name: "Health" },
    { id: "3", name: "Lifestyle" },
  ];

  return (
    <>
      <div className="flex flex-col p-8">
        <div className="flex w-full justify-between">
          <Breadcrumbs data={breadcrumbItems} />
        </div>
      </div>

      <div className="p-8 flex flex-col">
        <PostForm
          {...post}
          categoryId={post.categoryId || ""}
          tags={post.tags.map((tag) => ({ label: tag, value: tag }))}
          categories={categories}
        />
      </div>
    </>
  );
};

export default PostPage;
