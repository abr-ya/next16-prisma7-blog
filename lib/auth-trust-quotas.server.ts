import "server-only";

import type { Prisma, TrustChangeSource, UserTrustLevel } from "@/generated/prisma/client";
import { AUTH_TRUST_LEVELS, type AuthTrustLevel } from "@/lib/auth-trust";
import { hasAdminRole } from "@/lib/auth-roles";
import { AuthorizationError, requireAdminControl } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const VERIFIED_RESOURCE_LIMITS = {
  trip: 3,
  photo: 30,
  track: 10,
} as const;

export const PHOTO_LIKE_PROMOTION_THRESHOLD = 10;

export type VerifiedResource = keyof typeof VERIFIED_RESOURCE_LIMITS;

type TrustActor = { id: string; trustLevel: AuthTrustLevel; isAdmin: boolean };
type TrustClient = Prisma.TransactionClient;

const lock = async (tx: TrustClient, key: string) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
};

const countOwnedResources = (tx: TrustClient, userId: string, resource: VerifiedResource) => {
  if (resource === "trip") return tx.hike.count({ where: { userId } });
  if (resource === "photo") return tx.photo.count({ where: { userId } });
  return tx.track.count({ where: { userId } });
};

/** Run the supplied record creation while holding the actor/category quota lock. */
export const assertVerifiedResourceQuota = async (tx: TrustClient, actor: TrustActor, resource: VerifiedResource) => {
  await lock(tx, `trust-quota:${resource}:${actor.id}`);

  if (!actor.isAdmin && actor.trustLevel === AUTH_TRUST_LEVELS.VERIFIED) {
    const count = await countOwnedResources(tx, actor.id, resource);
    if (count >= VERIFIED_RESOURCE_LIMITS[resource]) {
      throw new AuthorizationError(`Verified account ${resource} limit reached`);
    }
  }
};

export const createWithinVerifiedResourceQuota = async <T>(
  actor: TrustActor,
  resource: VerifiedResource,
  create: (tx: TrustClient) => Promise<T>,
) =>
  prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await assertVerifiedResourceQuota(tx, actor, resource);
    return create(tx);
  });

type TransitionValues = {
  userId: string;
  fromLevel: UserTrustLevel;
  toLevel: UserTrustLevel;
  source: TrustChangeSource;
  actorUserId?: string | null;
};

/** Conditionally changes trust and writes its audit row atomically. */
export const transitionTrustLevel = async (tx: TrustClient, values: TransitionValues) => {
  const updated = await tx.user.updateMany({
    where: { id: values.userId, trustLevel: values.fromLevel },
    data: { trustLevel: values.toLevel },
  });
  if (updated.count !== 1) return false;

  await tx.trustChangeLog.create({
    data: {
      targetUserId: values.userId,
      actorUserId: values.actorUserId ?? null,
      fromLevel: values.fromLevel,
      toLevel: values.toLevel,
      source: values.source,
    },
  });
  return true;
};

export const reconcileVerifiedUserTrust = async (tx: TrustClient, userId: string) => {
  await lock(tx, `trust-promotion:${userId}`);
  const user = await tx.user.findUnique({ where: { id: userId }, select: { trustLevel: true } });
  if (user?.trustLevel !== AUTH_TRUST_LEVELS.VERIFIED) return false;

  const likes = await tx.photoLike.count({ where: { photo: { userId }, NOT: { userId } } });
  if (likes < PHOTO_LIKE_PROMOTION_THRESHOLD) return false;

  return transitionTrustLevel(tx, {
    userId,
    fromLevel: AUTH_TRUST_LEVELS.VERIFIED,
    toLevel: AUTH_TRUST_LEVELS.TRUSTED,
    source: "AUTO_PROMOTION",
  });
};

/** Server action boundary for feature-093's future administrator UI. */
export const setNonAdminUserTrustLevel = async ({
  userId,
  trustLevel,
}: {
  userId: string;
  trustLevel: Exclude<UserTrustLevel, "NEW">;
}) => {
  const actor = await requireAdminControl();
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const target = await tx.user.findUnique({ where: { id: userId }, select: { role: true, trustLevel: true } });
    if (!target) throw new Error("User not found");
    if (hasAdminRole(target.role)) throw new AuthorizationError("Administrator trust level cannot be changed");
    if (target.trustLevel === trustLevel) return false;
    return transitionTrustLevel(tx, {
      userId,
      fromLevel: target.trustLevel,
      toLevel: trustLevel,
      source: "ADMIN_MANUAL",
      actorUserId: actor.id,
    });
  });
};
