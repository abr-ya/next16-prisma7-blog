import { getAllUserPosts } from "@/app/_data/posts";
import { AdminPageLayout, LinkToPostDialog, PostsTable } from "@/components/index";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PostsPage = async () => {
  await requireAuth();

  const posts = await getAllUserPosts();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Posts", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <div className="flex gap-2">
          <LinkToPostDialog posts={posts} />
          <Link href="/posts/new">
            <Button className="cursor-pointer">Create new post</Button>
          </Link>
        </div>
      }
    >
      {/* DataTable */}
      <PostsTable data={posts} />
    </AdminPageLayout>
  );
};

export default PostsPage;
