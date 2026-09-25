import "server-only";

import { authSession } from "./auth-utils";
import prisma from "./prisma";
import { AUTH_TRUST_LEVELS, type AuthTrustLevel } from "./auth-trust";

export type CurrentUserTrust = {
  userId: string;
  trustLevel: AuthTrustLevel;
} | null;

/**
 * Server-only read of the current session user's trust level.
 * Mirrors `currentUserRole` from `lib/auth-utils.ts` so gate slices can swap one for the other.
 * Returns `null` for anonymous viewers.
 */
export const getCurrentUserTrust = async (): Promise<CurrentUserTrust> => {
  const session = await authSession();

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { trustLevel: true },
  });

  return {
    userId: session.user.id,
    trustLevel: user?.trustLevel ?? AUTH_TRUST_LEVELS.NEW,
  };
};
