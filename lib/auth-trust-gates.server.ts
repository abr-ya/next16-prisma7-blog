import "server-only";

import { AUTH_TRUST_LEVELS, type AuthTrustLevel } from "@/lib/auth-trust";
import { AuthorizationError, requireActionUser } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import prisma from "@/lib/prisma";

export type TrustGatedAction = "like" | "comment" | "trip-create" | "photo-upload" | "track-upload";

export class InsufficientTrustError extends AuthorizationError {
  readonly code = "INSUFFICIENT_TRUST";

  constructor(readonly trustLevel: AuthTrustLevel) {
    super(
      trustLevel === AUTH_TRUST_LEVELS.RESTRICTED
        ? "This account cannot perform this action"
        : "Account verification is required to perform this action",
    );
    this.name = "InsufficientTrustError";
  }
}

export type TrustGatedUser = {
  id: string;
  trustLevel: AuthTrustLevel;
  isAdmin: boolean;
};

const canPerformTrustGatedAction = (trustLevel: AuthTrustLevel) =>
  trustLevel === AUTH_TRUST_LEVELS.VERIFIED || trustLevel === AUTH_TRUST_LEVELS.TRUSTED;

/**
 * Resolves the authenticated actor's persisted role and trust state for a
 * server mutation. Administrators retain their existing capabilities even if
 * their ordinary trust level is NEW or RESTRICTED.
 */
export const requireTrustGatedAction = async (action: TrustGatedAction): Promise<TrustGatedUser> => {
  void action;
  const sessionUser = await requireActionUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, trustLevel: true },
  });

  const trustLevel = user?.trustLevel ?? AUTH_TRUST_LEVELS.NEW;
  const isAdmin = hasAdminRole(user?.role);

  if (!isAdmin && !canPerformTrustGatedAction(trustLevel)) {
    throw new InsufficientTrustError(trustLevel);
  }

  return { id: sessionUser.id, trustLevel, isAdmin };
};
