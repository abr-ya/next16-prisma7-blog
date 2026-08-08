import type { Category, ContentTag, Link, Post, User } from "@/generated/prisma/client";

export interface IPostWithUserAndCategory extends Post {
  user: User;
  category: Category | null;
  contentTags?: {
    tag: Pick<ContentTag, "name" | "slug">;
  }[];
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
