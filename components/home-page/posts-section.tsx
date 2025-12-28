import type { BlogPost } from "../../generated/prisma/client";
import { PostCard } from "./post-card";

interface PostsSectionProps {
  posts: BlogPost[];
}

export const PostsSection = ({ posts }: PostsSectionProps) => (
  <section className="py-10 px-4 max-w-3xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
    {posts.length > 0 ? (
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground">No posts yet.</p>
    )}
  </section>
);
