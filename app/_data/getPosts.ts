import prisma from "@/lib/prisma";

export const getLatestPosts = async (count = 3) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: count,
  });

  return posts;
};

export const getPostBySlug = async (slug: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  return post;
};
