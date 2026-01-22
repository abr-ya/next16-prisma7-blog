import { Post } from "@/generated/prisma/client";

export const PostCard = ({ post }: { post: Post }) => <div>{post.title}</div>;
