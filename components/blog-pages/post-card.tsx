import { stripHtml } from "@/lib/utils";
import { resolvePostDisplayTags } from "@/lib/content-tags";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../index";
import { PostUserAndLink } from "./post-user-and-link";
import { IPostWithUserAndCategory } from "@/app/_interfaces/post.interface";
import Link from "next/link";

interface IPostCardProps {
  post: IPostWithUserAndCategory;
}

export const PostCard = ({ post }: IPostCardProps) => {
  const displayTags = resolvePostDisplayTags(post);

  return (
    <Card className="w-full p-0 pb-4 border-0 shadow-md gap-1 relative">
      {/* Image */}
      <div className="relative h-60">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="rounded-sm object-cover w-full h-full"
          style={{ objectFit: "cover" }}
        />
      </div>
      <CardHeader className="gap-0">
        <CardTitle className="font-semibold line-clamp-3 pt-2">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Text Preview */}
        <p className="text-sm line-clamp-3">{stripHtml(post.content)}</p>
        {/* Tags */}
        {displayTags.length > 0 ? (
          <div className="flex gap-2 py-2 flex-wrap">
            {displayTags.map((tag) => (
              <Link href={`/blog/tag/${tag}`} key={tag}>
                <Badge variant="secondary">#{tag}</Badge>
              </Link>
            ))}
          </div>
        ) : null}
        {/* Author and Links */}
        <PostUserAndLink
          name={post.user.name ?? ""}
          avatar={post.user.image ?? null}
          created={post.createdAt}
          slug={post.slug}
        />
      </CardContent>
    </Card>
  );
};
