import type { Metadata } from "next";

import { getAllPosts } from "../_data/posts";
import { About, Pagination, PostCard } from "@/components/index";
import { IPostWithUserAndCategory } from "../_interfaces/post.interface";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Posts, notes, and updates from the public blog.",
  path: "/blog",
});

const BlogPage = async () => {
  const posts: IPostWithUserAndCategory[] = await getAllPosts();

  return (
    <>
      <About />
      <div className="flex flex-col gap-6 justify-center">
        <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {posts.length > 0 && <Pagination currentPage={1} totalPages={1} page={1} />}
      </div>
    </>
  );
};

export default BlogPage;
