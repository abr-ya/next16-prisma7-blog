export const getAllMdDocs = async () => {
  const { default: prisma } = await import("@/lib/prisma");
  const posts = await prisma.mdDoc.findMany({
    orderBy: { createdAt: "desc" },
  });

  return posts;
};

export const getLatestMdDocs = async (count = 3) => {
  const { default: prisma } = await import("@/lib/prisma");
  const posts = await prisma.mdDoc.findMany({
    orderBy: { createdAt: "desc" },
    take: count,
  });

  return posts;
};

export const getMdDocBySlug = async (slug: string) => {
  const { default: prisma } = await import("@/lib/prisma");
  const post = await prisma.mdDoc.findUnique({
    where: { slug },
  });

  return post;
};
