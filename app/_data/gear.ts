"use server";

import { revalidatePath } from "next/cache";

import { getTrackActivityTypeById } from "@/app/_data/track-activity-types";
import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, requireActionUser } from "@/lib/auth-utils";
import { gearFitsActivityType } from "@/lib/gear";

// feature-121: the private, owner-only gear inventory. Every helper resolves
// the owner from the session — the client never sends an owner id — and every
// mutation reads its row with the owner in the `where` clause, so a record
// owned by somebody else is never reached, not merely refused afterwards.
//
// A gear item carries a *set* of activity types: the same shoes work for
// running and for walking. The set lives in the `GearToTrackActivityTypes`
// join table, so the owner picks any number of the active types, and none at
// all for an item that is not classified yet.

const GEAR_NAME_MAX_LENGTH = 120;

const gearListSelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  activityTypes: {
    select: {
      activityTypeId: true,
      activityType: {
        select: {
          id: true,
          nameEn: true,
          nameRu: true,
          isActive: true,
        },
      },
    },
  },
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

// The Prisma client is created through `require` in `lib/prisma.ts`, so the
// result of a query is not inferred. This selection is typed by hand so the
// linked activity types are known to be a list of ids.
const gearLinksSelect = {
  id: true,
  activityTypes: { select: { activityTypeId: true } },
} satisfies Prisma.GearSelect;

type GearWithLinks = Prisma.GearGetPayload<{ select: typeof gearLinksSelect }>;

export type GearErrorCode = "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED";

export type GearSaveResult = { ok: true; gear: GearListItem } | { ok: false; code: GearErrorCode; message: string };

export type GearDeleteResult = { ok: true } | { ok: false; code: GearErrorCode; message: string };

export type GearValues = {
  name?: string | null;
  activityTypeIds?: string[] | null;
};

// feature-124: the preferred gear record per activity type. The map is keyed
// by the activity type id, so a page reads the whole set in one query and
// never has to ask about a second type. The activity type travels with the
// entry because the gear page has to name the type in the interface
// language, and the dictionary value may be inactive by then — a deactivated
// type keeps its preference (the classification stays, only the offer goes).
export type OwnerGearPreference = {
  gearId: string;
  activityType: {
    id: string;
    nameEn: string;
    nameRu: string | null;
  };
};

export type OwnerGearPreferences = Record<string, OwnerGearPreference>;

export type GearPreferenceResult = { ok: true } | { ok: false; code: GearErrorCode; message: string };

const gearPreferenceSelect = {
  gearId: true,
  activityType: {
    select: {
      id: true,
      nameEn: true,
      nameRu: true,
    },
  },
} satisfies Prisma.GearPreferenceSelect;

type GearPreferenceWithType = Prisma.GearPreferenceGetPayload<{ select: typeof gearPreferenceSelect }>;

// The gear record with its activity type ids — the shape the compatibility
// rule is checked against.
const gearWithTypeIdsSelect = {
  id: true,
  activityTypes: { select: { activityTypeId: true } },
} satisfies Prisma.GearSelect;

type GearWithTypeIds = Prisma.GearGetPayload<{ select: typeof gearWithTypeIdsSelect }>;

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
 * The activity types are borrowed dictionary values: only an active one may be
 * attached. `getTrackActivityTypeById` returns `null` for an unknown *and* for
 * an inactive id, so both are rejected the same way.
 *
 * One exception keeps the record editable: a type that is already attached
 * stays attached even after it was deactivated, so editing the name of that
 * gear item does not fail on a type the owner never chose to remove. A type
 * the owner attaches afresh must be active.
 */
const resolveActivityTypeIds = async (value: string[] | null | undefined, alreadyLinkedIds: string[]) => {
  const ids = Array.from(new Set((value ?? []).map((id) => (id ?? "").trim()).filter(Boolean)));

  if (!ids.length) return { ok: true as const, activityTypeIds: [] as string[] };

  const linked = new Set(alreadyLinkedIds);
  const resolved: string[] = [];

  for (const id of ids) {
    if (linked.has(id)) {
      resolved.push(id);

      continue;
    }

    const activityType = await getTrackActivityTypeById(id);

    if (!activityType) return { ok: false as const, message: "Selected activity type is not available" };

    resolved.push(activityType.id);
  }

  return { ok: true as const, activityTypeIds: resolved };
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

    const activityTypes = await resolveActivityTypeIds(values.activityTypeIds, []);

    if (!activityTypes.ok) return { ok: false, code: "VALIDATION", message: activityTypes.message };

    const { default: prisma } = await import("@/lib/prisma");
    const gear = await prisma.gear.create({
      data: {
        name: name.name,
        userId,
        activityTypes: {
          create: activityTypes.activityTypeIds.map((activityTypeId) => ({ activityTypeId })),
        },
      },
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
    const existingGear: GearWithLinks = await prisma.gear.findFirst({
      where: { id: gearId, userId },
      select: gearLinksSelect,
    });

    if (!existingGear) return { ok: false, code: "NOT_FOUND", message: "Gear not found" };

    const name = normalizeGearName(values.name);

    if (!name.ok) return { ok: false, code: "VALIDATION", message: name.message };

    const activityTypes = await resolveActivityTypeIds(
      values.activityTypeIds,
      existingGear.activityTypes.map((link) => link.activityTypeId),
    );

    if (!activityTypes.ok) return { ok: false, code: "VALIDATION", message: activityTypes.message };

    const nextActivityTypeIds = activityTypes.activityTypeIds;
    const previousActivityTypeIds = existingGear.activityTypes.map((link) => link.activityTypeId);
    const removedActivityTypeIds = previousActivityTypeIds.filter((id) => !nextActivityTypeIds.includes(id));

    // feature-124: the preference for an activity type the owner just removed
    // from the record goes in the same save — the removal *is* the statement
    // "these are not for that any more". A record that becomes classified
    // also loses the preferences for the types it does not carry, because it
    // no longer fits them. A record that stays unclassified keeps them: an
    // unclassified record fits every type.
    const gear = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.gear.update({
        where: { id: existingGear.id },
        data: {
          name: name.name,
          activityTypes: {
            deleteMany: {},
            create: nextActivityTypeIds.map((activityTypeId) => ({ activityTypeId })),
          },
        },
        select: gearListSelect,
      });

      if (nextActivityTypeIds.length) {
        await tx.gearPreference.deleteMany({
          where: {
            userId,
            gearId: existingGear.id,
            activityTypeId: { notIn: nextActivityTypeIds },
          },
        });
      } else if (removedActivityTypeIds.length) {
        await tx.gearPreference.deleteMany({
          where: {
            userId,
            gearId: existingGear.id,
            activityTypeId: { in: removedActivityTypeIds },
          },
        });
      }

      return updated;
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
      select: { id: true, _count: { select: { tracks: true } } },
    });

    if (!existingGear) return { ok: false, code: "NOT_FOUND", message: "Gear not found" };

    // feature-122: a gear item that is still attached to a track cannot go.
    // The foreign key refuses the delete as well, but the refusal the owner
    // reads is this one: it says how many tracks still point at the item and
    // what has to happen first.
    if (existingGear._count.tracks > 0) {
      const count = existingGear._count.tracks;

      return {
        ok: false,
        code: "VALIDATION",
        message: `This gear is attached to ${count} track${count === 1 ? "" : "s"} and cannot be deleted until the attachment is cleared`,
      };
    }

    await prisma.gear.delete({ where: { id: existingGear.id } });

    revalidatePath("/my/gear");

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

/**
 * feature-124: the owner's preferences, read as one map keyed by the activity
 * type id. The owner comes from the session, so another owner's preferences
 * are never in the result — the privacy of the preference is a property of
 * the read, not of the surface that shows it.
 */
export const getOwnerGearPreferences = async (): Promise<OwnerGearPreferences> => {
  const userId = await getOwnerUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const preferences: GearPreferenceWithType[] = await prisma.gearPreference.findMany({
    where: { userId },
    select: gearPreferenceSelect,
  });
  const entries = preferences.map((preference) => {
    const entry: OwnerGearPreference = {
      gearId: preference.gearId,
      activityType: preference.activityType,
    };

    return [preference.activityType.id, entry] as const;
  });

  return Object.fromEntries(entries);
};

/**
 * feature-124: the owner names one gear record as the preferred one for an
 * activity type. The rules are the ones the attachment already applies: the
 * record must belong to the owner, the type must be a live dictionary value,
 * and the record must fit the type — the same compatibility helper
 * (feature-122, decision 3), so the owner learns it once.
 */
export const setPreferredGearForActivityType = async ({
  activityTypeId,
  gearId,
}: {
  activityTypeId: string | null | undefined;
  gearId: string | null | undefined;
}): Promise<GearPreferenceResult> => {
  try {
    const userId = await getOwnerUserId();
    const typeId = (activityTypeId ?? "").trim();
    const gearRecordId = (gearId ?? "").trim();

    if (!typeId) return { ok: false, code: "VALIDATION", message: "Activity type is required" };
    if (!gearRecordId) return { ok: false, code: "VALIDATION", message: "Gear is required" };

    // `getTrackActivityTypeById` returns `null` for an unknown *and* for an
    // inactive id, so both are refused the same way.
    const activityType = await getTrackActivityTypeById(typeId);

    if (!activityType) return { ok: false, code: "VALIDATION", message: "Selected activity type is not available" };

    const { default: prisma } = await import("@/lib/prisma");
    const gear: GearWithTypeIds = await prisma.gear.findFirst({
      where: { id: gearRecordId, userId },
      select: gearWithTypeIdsSelect,
    });

    if (!gear) return { ok: false, code: "NOT_FOUND", message: "Gear not found" };

    if (
      !gearFitsActivityType(
        gear.activityTypes.map((link) => link.activityTypeId),
        typeId,
      )
    ) {
      return { ok: false, code: "VALIDATION", message: "This gear does not fit the selected activity type" };
    }

    await prisma.gearPreference.upsert({
      where: { userId_activityTypeId: { userId, activityTypeId: typeId } },
      create: { userId, activityTypeId: typeId, gearId: gear.id },
      update: { gearId: gear.id },
    });

    revalidatePath("/my/gear");
    revalidatePath("/my/workouts");

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

/**
 * feature-124: the owner drops the preference for an activity type. The
 * delete is owner-scoped, so another owner's preference for the same type is
 * untouched, and a type that carries no preference is a no-op.
 */
export const clearPreferredGearForActivityType = async (
  activityTypeId: string | null | undefined,
): Promise<GearPreferenceResult> => {
  try {
    const userId = await getOwnerUserId();
    const typeId = (activityTypeId ?? "").trim();

    if (!typeId) return { ok: false, code: "VALIDATION", message: "Activity type is required" };

    const { default: prisma } = await import("@/lib/prisma");

    await prisma.gearPreference.deleteMany({ where: { userId, activityTypeId: typeId } });

    revalidatePath("/my/gear");
    revalidatePath("/my/workouts");

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};
