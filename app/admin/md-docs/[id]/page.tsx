import { Breadcrumbs, MdDocForm } from "@/components/index";
import type { MdDoc as IMdDoc } from "@/generated/prisma/client";

const MdDocAdminPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("MdDocAdminPage, id: ", id);

  let post: Omit<IMdDoc, "createdAt" | "updatedAt"> = {
    id: "",
    title: "",
    description: null,
    content: "",
    slug: "",
  };

  if (id !== "new") {
    const { getMdDocById } = await import("@/app/_data/mdDocs");
    const fetchedPost = await getMdDocById(id);
    if (fetchedPost) {
      post = fetchedPost;
    }
  }

  const breadcrumbItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "MD Docs", to: "/admin/md-docs" },
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
        <MdDocForm
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

export default MdDocAdminPage;
