"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";

import { requireAdminControl } from "@/lib/auth-utils";

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");
const toKey = (value: string) => normalizeName(value).toLocaleLowerCase("en-US");

export type TrackActivityTypeValues = { id?: string; name: string };

export const getActiveTrackActivityTypes = async () => {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma.trackActivityType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
};

export const getAdminTrackActivityTypes = async () => {
  await requireAdminControl();
  const { default: prisma } = await import("@/lib/prisma");
  return prisma.trackActivityType.findMany({
    include: { _count: { select: { tracks: true } } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
};

const revalidate = () => {
  revalidatePath("/admin/track-activity-types");
  revalidatePath("/admin/tracks");
  revalidatePath("/my/tracks");
};

export const createTrackActivityType = async ({ name }: TrackActivityTypeValues) => {
  await requireAdminControl();
  const normalizedName = normalizeName(name);
  if (!normalizedName) throw new Error("Activity type name is required");
  const { default: prisma } = await import("@/lib/prisma");
  const result = await prisma.trackActivityType.create({ data: { name: normalizedName, key: toKey(normalizedName) } });
  revalidate();
  return result;
};

export const updateTrackActivityType = async ({ id, name }: TrackActivityTypeValues) => {
  await requireAdminControl();
  if (!id) throw new Error("Activity type id is required");
  const normalizedName = normalizeName(name);
  if (!normalizedName) throw new Error("Activity type name is required");
  const { default: prisma } = await import("@/lib/prisma");
  const result = await prisma.trackActivityType.update({ where: { id }, data: { name: normalizedName, key: toKey(normalizedName) } });
  revalidate();
  return result;
};

export const setTrackActivityTypeActive = async ({ id, isActive }: { id: string; isActive: boolean }) => {
  await requireAdminControl();
  const { default: prisma } = await import("@/lib/prisma");
  const result = await prisma.trackActivityType.update({ where: { id }, data: { isActive } });
  revalidate();
  return result;
};

export const deleteTrackActivityType = async ({ id, replacementId }: { id: string; replacementId?: string | null }) => {
  await requireAdminControl();
  const { default: prisma } = await import("@/lib/prisma");
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const type = await tx.trackActivityType.findUnique({ where: { id }, select: { _count: { select: { tracks: true } } } });
    if (!type) throw new Error("Activity type not found");
    if (type._count.tracks && replacementId === undefined) throw new Error("Reassign or clear classified tracks before deleting this type");
    if (replacementId) {
      if (replacementId === id) throw new Error("Choose a different replacement type");
      const replacement = await tx.trackActivityType.findFirst({ where: { id: replacementId, isActive: true } });
      if (!replacement) throw new Error("Replacement activity type must be active");
    }
    if (type._count.tracks) await tx.track.updateMany({ where: { activityTypeId: id }, data: { activityTypeId: replacementId ?? null } });
    await tx.trackActivityType.delete({ where: { id } });
  });
  revalidate();
};
