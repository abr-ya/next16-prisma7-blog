import { Post } from "@/generated/prisma/client";
import Link from "next/link";

interface IPostsTableProps {
  data: Post[];
}

export const PostsTable = ({ data }: IPostsTableProps) => {
  return (
    <div>
      posts-table: {data.length}
      {data.map((post) => (
        <Link href={`/posts/${post.id}`} key={post.id}>
          <h3 className="font-semibold">{post.title}</h3>
        </Link>
      ))}
    </div>
  );
};
