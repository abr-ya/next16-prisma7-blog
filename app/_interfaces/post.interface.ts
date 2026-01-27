import { Category, Post, User } from "@/generated/prisma/client";

export interface IPostWithUserAndCategory extends Post {
  user: User;
  category: Category | null;
}
