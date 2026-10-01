import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { AuthorizationError } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const COMMENT_CREATION_INTERVAL_MS = 15_000;

export class CommentRateLimitError extends AuthorizationError {
  readonly code = "COMMENT_RATE_LIMITED";

  constructor() {
    super("Please wait before posting another comment");
    this.name = "CommentRateLimitError";
  }
}

type CreateCommentWithRateLimitOptions<T> = {
  userId: string;
  create: (tx: Prisma.TransactionClient) => Promise<T>;
};

/**
 * Serializes one user's comment creations across every supported target domain.
 * The advisory transaction lock makes the timestamp check and comment insert
 * atomic without adding a separate persisted rate-limit record.
 */
export const createCommentWithRateLimit = async <T>({
  userId,
  create,
}: CreateCommentWithRateLimitOptions<T>): Promise<T> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`comment-creation:${userId}`}))`;

    const latestComment = await tx.comment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (latestComment && Date.now() - latestComment.createdAt.getTime() < COMMENT_CREATION_INTERVAL_MS) {
      throw new CommentRateLimitError();
    }

    return create(tx);
  });
};
