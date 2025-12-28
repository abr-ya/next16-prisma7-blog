import prisma from "@/lib/prisma";

async function main() {
  const blogPosts = [
    {
      slug: "what-is-tailwindcss",
      title: "What Is Tailwind CSS?",
      content: `# What Is Tailwind CSS?
        Tailwind CSS is a utility-first CSS framework that makes styling fast and consistent.

        ## Benefits
        - No more custom CSS files
        - Responsive utilities
        - Easy to customize

        **Tip:** Combine Tailwind with Next.js for a smooth workflow.`,
    },
    {
      slug: "getting-started-with-prisma",
      title: "Getting Started with Prisma",
      content: `# Getting Started with Prisma
        Prisma is a modern ORM for Node.js and TypeScript that makes database work easier.

        ## What You Can Do
        - Define your database schema
        - Run migrations
        - Query data with type safety

        **Reminder:** Always run \`npx prisma generate\` after updating the schema.`,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: post,
    });
  }

  console.log("Seed data has been inserted successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
