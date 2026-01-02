import { getLatestBlogPosts } from "@/app/_data";
import { Breadcrumbs } from "@/components/index";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PostsPage = async () => {
  const data = await getLatestBlogPosts(); // todo: update it!
  console.log(data);

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Posts", to: null },
  ];

  return (
    <>
      <div className="flex flex-col p-8">
        <div className="flex w-full justify-between">
          <Breadcrumbs data={breadItems} />
          <Link href="/posts/new">
            <Button className="cursor-pointer">Create new post</Button>
          </Link>
        </div>
      </div>
      {/* DataTable */}
      todo: DataTable
    </>
  );
};

export default PostsPage;
