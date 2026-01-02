import Link from "next/link";
import { Card, CardContent } from "..";
import { BlogPost } from "@/generated/prisma/client";

export const PostCard = ({ post }: { post: BlogPost }) => {
  return (
    <Card key={post.id} className="hover:bg-accent transition-colors">
      <Link href={`/blog/${post.slug}`}>
        <CardContent className="p-4">
          <h3 className="font-semibold">{post.title}</h3>
          <p className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Link>
    </Card>
  );
};
