import { Breadcrumbs, PostForm } from "@/components/index";

const PostPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log(id);

  const breadcrumbItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Posts", to: "/posts" },
    { label: "New", to: null }, // or post title if editing
  ];

  const categories = [
    { id: "1", name: "Technology" },
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
        {/* todo: Add variant for editing! */}
        <PostForm
          id=""
          title=""
          content=""
          imageUrl=""
          categoryId=""
          tags={[]}
          status=""
          categories={categories}
          slug=""
        />
      </div>
    </>
  );
};

export default PostPage;
