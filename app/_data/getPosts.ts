import prisma from "@/lib/prisma";

export const getLatestPosts = async () => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return posts;
};
