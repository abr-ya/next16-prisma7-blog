import { UserTrustLevel } from "@/generated/prisma/client";

export const AUTH_TRUST_LEVELS = {
  NEW: "NEW",
  VERIFIED: "VERIFIED",
  TRUSTED: "TRUSTED",
  RESTRICTED: "RESTRICTED",
} as const;

export type AuthTrustLevel = UserTrustLevel;

const TRUST_LEVEL_VALUES = new Set<UserTrustLevel>([
  AUTH_TRUST_LEVELS.NEW,
  AUTH_TRUST_LEVELS.VERIFIED,
  AUTH_TRUST_LEVELS.TRUSTED,
  AUTH_TRUST_LEVELS.RESTRICTED,
]);

/** Tolerant parser — unknown / missing values fall back to `NEW`. Never throws. */
export const parseUserTrustLevel = (value: unknown): AuthTrustLevel => {
  if (typeof value === "string" && TRUST_LEVEL_VALUES.has(value as UserTrustLevel)) {
    return value as UserTrustLevel;
  }
  return AUTH_TRUST_LEVELS.NEW;
};

/**
 * Pure read of the effective trust level from a user-shaped object.
 * Treats missing / null `trustLevel` as `NEW` so callers can pass partial rows.
 */
export const getEffectiveTrust = (
  user: { trustLevel?: AuthTrustLevel | string | null } | null | undefined,
): AuthTrustLevel => parseUserTrustLevel(user?.trustLevel);
