"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { HikeStatus, HikeType } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";
import { createSlug } from "@/lib/slug-generator";

export type HikeActionValues = {
  id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  type: HikeType;
  status?: HikeStatus;
};

export type HikeListItem = Prisma.HikeGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

const DEFAULT_HIKE_STATUS: HikeStatus = "DRAFT";
const HIKE_TYPES = new Set<HikeType>(["HIKING", "MOUNTAIN", "WATER", "SKI", "BIKE", "OTHER"]);
const HIKE_STATUSES = new Set<HikeStatus>(["DRAFT", "PUBLISHED"]);

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
};

const normalizeOptionalText = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

const normalizeHikeDate = (value: Date | string, fieldName: string) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is invalid`);
  }

  return date;
};

const normalizeHikeSlug = (title: string, value?: string | null) => {
  const slug = createSlug(value?.trim() || title);

  if (!slug) {
    throw new Error("Slug is required");
  }

  return slug;
};

const getHikeData = ({ title, slug, description, startDate, endDate, type, status }: HikeActionValues) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStartDate = normalizeHikeDate(startDate, "Start date");
  const normalizedEndDate = normalizeHikeDate(endDate, "End date");

  if (normalizedEndDate < normalizedStartDate) {
    throw new Error("End date must be the same as or later than start date");
  }

  if (!HIKE_TYPES.has(type)) {
    throw new Error("Hike type is invalid");
  }

  const normalizedStatus = status ?? DEFAULT_HIKE_STATUS;

  if (!HIKE_STATUSES.has(normalizedStatus)) {
    throw new Error("Hike status is invalid");
  }

  return {
    title: normalizedTitle,
    slug: normalizeHikeSlug(normalizedTitle, slug),
    description: normalizeOptionalText(description),
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    type,
    status: normalizedStatus,
  };
};

const ensureSlugAvailable = async ({ slug, id }: { slug: string; id?: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingHike && existingHike.id !== id) {
    throw new Error("A hike with this slug already exists");
  }
};

const hikeListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.HikeInclude;

const revalidateHikePaths = (slug?: string) => {
  revalidatePath("/admin/hikes");
  revalidatePath("/hikes");

  if (slug) {
    revalidatePath(`/hikes/${slug}`);
  }
};

export const getAllHikes = async (): Promise<HikeListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findMany({
    where: { userId },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getHikeById = async (id: string): Promise<HikeListItem | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findFirst({
    where: { id, userId },
    include: hikeListInclude,
  });
};

export const getPublicHikes = async (): Promise<HikeListItem[]> => {
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findMany({
    where: { status: "PUBLISHED" },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getPublicHikeBySlug = async (slug: string): Promise<HikeListItem | null> => {
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: hikeListInclude,
  });
};

export const createHike = async (values: HikeActionValues) => {
  const userId = await getRequiredUserId();
  const data = getHikeData(values);
  const { default: prisma } = await import("@/lib/prisma");

  await ensureSlugAvailable({ slug: data.slug });

  const hike = await prisma.hike.create({
    data: {
      ...data,
      userId,
    },
  });

  revalidateHikePaths(hike.slug);

  return hike;
};

export const updateHike = async (values: HikeActionValues) => {
  if (!values.id) {
    throw new Error("Hike id is required");
  }

  const userId = await getRequiredUserId();
  const data = getHikeData(values);
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findFirst({
    where: { id: values.id, userId },
    select: { id: true, slug: true },
  });

  if (!existingHike) {
    throw new Error("Hike not found");
  }

  await ensureSlugAvailable({ slug: data.slug, id: existingHike.id });

  const hike = await prisma.hike.update({
    where: { id: existingHike.id },
    data,
  });

  revalidateHikePaths(existingHike.slug);
  revalidateHikePaths(hike.slug);

  return hike;
};

export const deleteHike = async (id: string) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findFirst({
    where: { id, userId },
    select: { id: true, slug: true },
  });

  if (!existingHike) {
    return { success: false };
  }

  await prisma.hike.delete({
    where: { id: existingHike.id },
  });

  revalidateHikePaths(existingHike.slug);

  return { success: true };
};
