import { getAllUserPosts } from "@/app/_data/posts";
import { AdminPageLayout, PostsTable } from "@/components/index";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PostsPage = async () => {
  await requireAuth();

  const data = await getAllUserPosts();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Posts", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <Link href="/posts/new">
          <Button className="cursor-pointer">Create new post</Button>
        </Link>
      }
    >
      {/* DataTable */}
      <PostsTable data={data} />
    </AdminPageLayout>
  );
};

export default PostsPage;
