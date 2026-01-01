import prisma from "@/lib/prisma";

export const getLatestBlogPosts = async (count = 3) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: count,
  });

  return posts;
};

export const getBlogPostBySlug = async (slug: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  return post;
};
