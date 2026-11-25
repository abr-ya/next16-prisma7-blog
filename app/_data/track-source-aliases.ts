"use server";

import { Prisma } from "@/generated/prisma/client";
import { requireActionUser } from "@/lib/auth-utils";

// feature-161: the owner's display names for raw GPX source strings. This
// first slice only reads them; the management actions and the read-time
// resolution arrive in the follow-up slice.

const sourceAliasListSelect = {
  id: true,
  kind: true,
  rawValue: true,
  label: true,
  createdAt: true,
} satisfies Prisma.TrackSourceAliasSelect;

export type TrackSourceAliasListItem = Prisma.TrackSourceAliasGetPayload<{
  select: typeof sourceAliasListSelect;
}>;

export const getOwnerSourceAliases = async (): Promise<TrackSourceAliasListItem[]> => {
  const actor = await requireActionUser();
  const { default: prisma } = await import("@/lib/prisma");

  return (await prisma.trackSourceAlias.findMany({
    where: { userId: actor.id },
    orderBy: [{ kind: "asc" }, { rawValue: "asc" }],
    select: sourceAliasListSelect,
  })) as TrackSourceAliasListItem[];
};
