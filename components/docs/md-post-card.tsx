import Link from "next/link";
import { Card, CardContent } from "..";
import type { MdDoc } from "@/generated/prisma/client";

export const MdPostCard = ({ post }: { post: MdDoc }) => (
  <Card key={post.id} className="hover:bg-accent transition-colors p-2">
    <Link href={`/docs/${post.slug}`}>
      <CardContent>
        <h3 className="font-semibold">{post.title}</h3>
        <p className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
      </CardContent>
    </Link>
  </Card>
);
