const prismaClientSingleton = () => {
  if (typeof window !== "undefined") {
    throw new Error("PrismaClient cannot be used in the browser");
  }

  // Lazily require the Prisma client and Postgres adapter so bundlers (like
  // Turbopack) don't attempt to resolve Node-only dependencies (e.g. `dns`)
  // for client bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("../generated/prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
