"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, requireActionUser } from "@/lib/auth-utils";

// feature-148: the private, owner-only list of saved places a route may start
// from. Every helper resolves the owner from the session — the client never
// sends an owner id — and every mutation reads its row with the owner in the
// `where` clause, so a place owned by somebody else is never reached, not
// merely refused afterwards.
//
// A place is a name the owner typed plus one coordinate. Nothing else is
// stored and nothing points back from a route: picking a place copies its
// coordinate into the route's first geometry point, so the place stays a
// reusable start and a route keeps geometry only.

const PLACE_NAME_MAX_LENGTH = 120;

const placeListSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FavoritePlaceSelect;

export type FavoritePlaceListItem = Prisma.FavoritePlaceGetPayload<{
  select: typeof placeListSelect;
}>;

export type FavoritePlaceErrorCode = "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED";

export type FavoritePlaceSaveResult =
  | { ok: true; place: FavoritePlaceListItem }
  | { ok: false; code: FavoritePlaceErrorCode; message: string };

export type FavoritePlaceDeleteResult = { ok: true } | { ok: false; code: FavoritePlaceErrorCode; message: string };

export type FavoritePlaceValues = {
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const getOwnerUserId = async () => {
  const user = await requireActionUser();

  return user.id;
};

const unauthorized = (): { ok: false; code: "UNAUTHORIZED"; message: string } => ({
  ok: false,
  code: "UNAUTHORIZED",
  message: "Authentication required",
});

const normalizePlaceName = (value: string | null | undefined) => {
  const name = (value ?? "").trim();

  if (!name) return { ok: false as const, message: "Place name is required" };
  if (name.length > PLACE_NAME_MAX_LENGTH)
    return { ok: false as const, message: `Place name must be ${PLACE_NAME_MAX_LENGTH} characters or fewer` };

  return { ok: true as const, name };
};

// The coordinate arrives from the map as two numbers. A missing value is as
// unusable as an out-of-range one, so both are refused with the same message
// instead of letting the database take a NaN or a point off the planet.
const normalizeCoordinate = (latitude: number | null | undefined, longitude: number | null | undefined) => {
  if (typeof latitude !== "number" || !Number.isFinite(latitude))
    return { ok: false as const, message: "Latitude is required" };
  if (typeof longitude !== "number" || !Number.isFinite(longitude))
    return { ok: false as const, message: "Longitude is required" };

  if (latitude < -90 || latitude > 90) return { ok: false as const, message: "Latitude must be between -90 and 90" };
  if (longitude < -180 || longitude > 180)
    return { ok: false as const, message: "Longitude must be between -180 and 180" };

  return { ok: true as const, latitude, longitude };
};

// The list keeps the order the places were added in: the owner reads it as the
// history of their starts, not as a sorted inventory.
export const getOwnerFavoritePlaces = async (): Promise<FavoritePlaceListItem[]> => {
  const userId = await getOwnerUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.favoritePlace.findMany({
    where: { userId },
    select: placeListSelect,
    orderBy: [{ createdAt: "asc" }],
  });
};

export const createFavoritePlace = async (values: FavoritePlaceValues): Promise<FavoritePlaceSaveResult> => {
  try {
    const userId = await getOwnerUserId();
    const name = normalizePlaceName(values.name);

    if (!name.ok) return { ok: false, code: "VALIDATION", message: name.message };

    const coordinate = normalizeCoordinate(values.latitude, values.longitude);

    if (!coordinate.ok) return { ok: false, code: "VALIDATION", message: coordinate.message };

    const { default: prisma } = await import("@/lib/prisma");
    const place = await prisma.favoritePlace.create({
      data: {
        name: name.name,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        userId,
      },
      select: placeListSelect,
    });

    revalidatePath("/my/places");

    return { ok: true, place };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

export const updateFavoritePlace = async ({
  id,
  ...values
}: FavoritePlaceValues & { id?: string | null }): Promise<FavoritePlaceSaveResult> => {
  try {
    const userId = await getOwnerUserId();
    const placeId = (id ?? "").trim();

    if (!placeId) return { ok: false, code: "VALIDATION", message: "Place id is required" };

    const { default: prisma } = await import("@/lib/prisma");
    const existingPlace = await prisma.favoritePlace.findFirst({
      where: { id: placeId, userId },
      select: { id: true },
    });

    if (!existingPlace) return { ok: false, code: "NOT_FOUND", message: "Place not found" };

    const name = normalizePlaceName(values.name);

    if (!name.ok) return { ok: false, code: "VALIDATION", message: name.message };

    const place = await prisma.favoritePlace.update({
      where: { id: existingPlace.id },
      data: { name: name.name },
      select: placeListSelect,
    });

    revalidatePath("/my/places");

    return { ok: true, place };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};

export const deleteFavoritePlace = async (id: string | null | undefined): Promise<FavoritePlaceDeleteResult> => {
  try {
    const userId = await getOwnerUserId();
    const placeId = (id ?? "").trim();

    if (!placeId) return { ok: false, code: "VALIDATION", message: "Place id is required" };

    const { default: prisma } = await import("@/lib/prisma");
    const existingPlace = await prisma.favoritePlace.findFirst({
      where: { id: placeId, userId },
      select: { id: true },
    });

    if (!existingPlace) return { ok: false, code: "NOT_FOUND", message: "Place not found" };

    await prisma.favoritePlace.delete({ where: { id: existingPlace.id } });

    revalidatePath("/my/places");

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return unauthorized();

    throw error;
  }
};
