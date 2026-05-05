import { Prisma } from "@/generated/prisma/client";

const GENERIC = "Unable to load posts. Please try again later.";
const UNREACHABLE = "Cannot reach the database. Check that the service is running and try again.";

/** English user-facing message for home page blog list failure (no secrets). */
export function getBlogPostsLoadErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
    return UNREACHABLE;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return UNREACHABLE;
  }
  return GENERIC;
}
