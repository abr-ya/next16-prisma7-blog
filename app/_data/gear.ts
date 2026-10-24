"use server";

import { revalidatePath } from "next/cache";

import { getTrackActivityTypeById } from "@/app/_data/track-activity-types";
import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, requireActionUser } from "@/lib/auth-utils";

// feature-121: the private, owner-only gear inventory. Every helper resolves
// the owner from the session — the client never sends an owner id — and every
// mutation reads its row with the owner in the `where` clause, so a record
// owned by somebody else is never reached, not merely refused afterwards.

const GEAR_NAME_MAX_LENGTH = 120;

const gearListSelect = {
  id: true,
  name: true,
  activityTypeId: true,
  createdAt: true,
  updatedAt: true,
  activityType: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.GearSelect;

export type GearListItem = Prisma.GearGetPayload<{
  select: typeof gearListSelect;
}>;

export type GearErrorCode = "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED";

export type GearSaveResult = { ok: true; gear: GearListItem } | { ok: false; code: GearErrorCode; message: string };

export type GearDeleteResult = { ok: true } | { ok: false; code: GearErrorCode; message: string };

export type GearValues = {
  name?: string | null;
  activityTypeId?: string | null;
};

const getOwnerUserId = async () => {
  const user = await requireActionUser();

  return user.id;
};

const normalizeGearName = (value: string | null | undefined) => {
  const name = (value ?? "").trim();

  if (!name) return { ok: false as const, message: "Gear name is required" };
  if (name.length > GEAR_NAME_MAX_LENGTH)
    return { ok: false as const, message: `Gear name must be ${GEAR_NAME_MAX_LENGTH} characters or fewer` };

  return { ok: true as const, name };
};

/**
 * The activity type is a borrowed dictionary value: only an active one may be
 * attached. `getTrackActivityTypeById` returns `null` for an unknown *and* for
 * an inactive id, so both are rejected the same way.
 */
const resolveActivityTypeId = async (value: string | null | undefined) => {
  const id = (value ?? "").trim();

  if (!id) return { ok: true as const, activityTypeId: null as string | null };

  const activityType = await getTrackActivityTypeById(id);

  if (!activityType) return { ok: false as const, message: "Selected activity type is not available" };

  return { ok: true as const, activityTypeId: activityType.id };
};

const unauthorized = (): { ok: false; code: "UNAUTHORIZED"; message: string } => ({
  ok: false,
  code: "UNAUTHORIZED",
  message: "Authentication required",
});

export const getOwnerGear = async (): Promise<GearListItem[]> => {
  const userId = await getOwnerUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.gear.findMany({
    where: { userId },
    select: gearListSelect,
    orderBy: [{ createdAt: "desc" }],
  });
};

export const createGear = async (values: GearValues): Promise<GearSaveResult> => {
  try {
    const userId = await getOwnerUserId();
    const name = normalizeGearName(values.name);

    if (!name.ok) return { ok: false, code: "VALIDATION", message: name.message };

    const activityType = await resolveActivityTypeId(values.activityTypeId);

    if (!activityType.ok) return { ok: false, code: "VALIDATION", message: activityType.message };

    const { default: prisma } = await import("@/lib/prisma");
    const gear = await prisma.gear.create({
      data: { name: name.name, activityTypeId: activityType.activityTypeId, userId },
      select: gearListSelect,
    });

    revalidatePath("/my/gear");

    return { ok: true, gear };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

export const updateGear = async ({ id, ...values }: GearValues & { id?: string | null }): Promise<GearSaveResult> => {
  try {
    const userId = await getOwnerUserId();
    const gearId = (id ?? "").trim();

    if (!gearId) return { ok: false, code: "VALIDATION", message: "Gear id is required" };

    const { default: prisma } = await import("@/lib/prisma");
    const existingGear = await prisma.gear.findFirst({
      where: { id: gearId, userId },
      select: { id: true },
    });

    if (!existingGear) return { ok: false, code: "NOT_FOUND", message: "Gear not found" };

    const name = normalizeGearName(values.name);

    if (!name.ok) return { ok: false, code: "VALIDATION", message: name.message };

    const activityType = await resolveActivityTypeId(values.activityTypeId);

    if (!activityType.ok) return { ok: false, code: "VALIDATION", message: activityType.message };

    const gear = await prisma.gear.update({
      where: { id: existingGear.id },
      data: { name: name.name, activityTypeId: activityType.activityTypeId },
      select: gearListSelect,
    });

    revalidatePath("/my/gear");

    return { ok: true, gear };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

export const deleteGear = async (id: string | null | undefined): Promise<GearDeleteResult> => {
  try {
    const userId = await getOwnerUserId();
    const gearId = (id ?? "").trim();

    if (!gearId) return { ok: false, code: "VALIDATION", message: "Gear id is required" };

    const { default: prisma } = await import("@/lib/prisma");
    const existingGear = await prisma.gear.findFirst({
      where: { id: gearId, userId },
      select: { id: true },
    });

    if (!existingGear) return { ok: false, code: "NOT_FOUND", message: "Gear not found" };

    await prisma.gear.delete({ where: { id: existingGear.id } });

    revalidatePath("/my/gear");

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};
