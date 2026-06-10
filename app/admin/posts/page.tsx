import { getAllLinks } from "@/app/_data/links";
import { getAllUserPosts } from "@/app/_data/posts";
import { AdminPageLayout, LinkToPostDialog, PostsTable } from "@/components/index";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PostsPage = async () => {
  const posts = await getAllUserPosts();
  const links = await getAllLinks();

  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Posts", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <div className="flex gap-2">
          <LinkToPostDialog posts={posts} links={links} />
          <Link href="/admin/posts/new">
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
