import prisma from "@/lib/prisma";

export const getLatestPosts = async (count = 3) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: count,
  });

  return posts;
};
