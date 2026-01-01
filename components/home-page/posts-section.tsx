import { ArrowRight } from "lucide-react";
import type { BlogPost } from "../../generated/prisma/client";
import { Button } from "../ui/button";
import { PostCard } from "./post-card";
import Link from "next/link";

interface PostsSectionProps {
  posts: BlogPost[];
  showAllLink?: boolean;
}

export const PostsSection = ({ posts, showAllLink }: PostsSectionProps) => (
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
    {showAllLink && (
      <Button variant="link" asChild className="mt-4 px-0">
        <Link href="/blog">
          View all posts <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>
    )}
  </section>
);
