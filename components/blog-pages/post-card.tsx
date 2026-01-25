import { Category, Post } from "@/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../index";
import Link from "next/link";
import { MoveRight } from "lucide-react";

interface IPostCardProps {
  // todo categoy and user ==> !
  post: Post & { category?: Category | null } & {
    user?: {
      name: string;
      id: string;
      image: string | null;
      savedPosts: string[];
    };
  };
}

export const PostCard = ({ post }: IPostCardProps) => (
  <Card className="w-full p-0 pb-4 border-0 shadow-md gap-1 relative">
    {/* Image */}
    <div className="relative h-60">todo: Image</div>
    <CardHeader className="gap-0">
      <CardTitle className="font-semibold line-clamp-3 pt-2">{post.title}</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Text Preview */}
      <p className="text-sm line-clamp-3">todo: preview text</p>
      {/* Tags */}
      <div className="flex gap-2 py-2 flex-wrap">todo: tags</div>
      {/* Author and Links */}
      <div className="flex justify-between w-full gap-2">
        <Link href={`/blog/${post.slug}`} className="flex gap-1 text-sx items-center font-medium">
          Read more <MoveRight />
        </Link>
      </div>
    </CardContent>
  </Card>
);
