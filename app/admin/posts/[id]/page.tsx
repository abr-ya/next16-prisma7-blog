import { Breadcrumbs, PostForm } from "@/components/index";
import { getCategories } from "@/app/_data/categories";
import { getAllContentTags } from "@/app/_data/content-tags";
import { resolvePostDisplayTags } from "@/lib/content-tags";

const PostPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("PostPage, id: ", id);

  const [categories, contentTagOptions] = await Promise.all([getCategories(), getAllContentTags()]);

  let post: {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    categoryId: string | null;
    tags: string[];
    status: "draft" | "published";
    slug: string;
    contentTags?: { tag: { name: string; slug: string } }[];
  } = {
    id: "",
    title: "",
    content: "",
    imageUrl: "",
    categoryId: "",
    tags: [],
    status: "draft",
    slug: "",
    contentTags: [],
  };

  if (id !== "new") {
    const { getPostById } = await import("@/app/_data/posts");
    post = await getPostById(id);
  }

  const displayTags = resolvePostDisplayTags(post);

  const breadcrumbItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Posts", to: "/admin/posts" },
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
        <PostForm
          id={post.id}
          title={post.title}
          content={post.content}
          imageUrl={post.imageUrl}
          status={post.status}
          slug={post.slug}
          categoryId={post.categoryId || ""}
          tags={displayTags.map((tag) => ({ label: tag, value: tag }))}
          tagOptions={contentTagOptions.map((tag) => ({ label: tag.name, value: tag.slug }))}
          categories={categories}
        />
      </div>
    </>
  );
};

export default PostPage;
