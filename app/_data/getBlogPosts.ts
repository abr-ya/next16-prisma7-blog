export const getLatestBlogPosts = async (count = 3) => {
  const { default: prisma } = await import("@/lib/prisma");
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: count,
  });

  return posts;
};

export const getBlogPostBySlug = async (slug: string) => {
  const { default: prisma } = await import("@/lib/prisma");
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  return post;
};
