import { Post as IPost } from "@/generated/prisma/client";

interface IPostsTableProps {
  data: IPost[];
}

export const PostsTable = ({ data }: IPostsTableProps) => {
  return <div>posts-table: {data.length}</div>;
};
