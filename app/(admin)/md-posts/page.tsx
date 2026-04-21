import { getAllBlogPosts } from "@/app/_data/getBlogPosts";
import { AdminPageLayout, BlogPostsTable } from "@/components/index";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MdPostsPage = async () => {
  const posts = await getAllBlogPosts();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "MD Posts", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <div className="flex gap-2">
          <Link href="/md-posts/new">
            <Button className="cursor-pointer">Add Doc</Button>
          </Link>
        </div>
      }
    >
      {/* DataTable */}
      <BlogPostsTable data={posts} />
    </AdminPageLayout>
  );
};

export default MdPostsPage;
