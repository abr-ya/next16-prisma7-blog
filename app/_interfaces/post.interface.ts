import type { Category, Link, Post, User } from "@/generated/prisma/client";

export interface IPostWithUserAndCategory extends Post {
  user: User;
  category: Category | null;
}

export interface IPostLink {
  link: Link;
  postId: string;
  linkId: string;
  assignedAt: Date;
}

export interface IPostDetails extends IPostWithUserAndCategory {
  links: IPostLink[];
}
