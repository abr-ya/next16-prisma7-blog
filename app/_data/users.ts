import "server-only";

import { requireAdmin } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const ADMIN_USERS_PAGE_SIZE = 20;

export type AdminUserDirectoryInput = {
  email?: string | null;
  page?: number | null;
};

export type AdminUserDirectoryRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  role: string;
  trustLevel: string;
  accounts: {
    providerId: string;
  }[];
};

const normalizeEmailSearch = (email: string | null | undefined) => email?.trim().slice(0, 320) ?? "";

const normalizePage = (page: number | null | undefined) =>
  typeof page === "number" && Number.isInteger(page) && page > 0 ? page : 1;

export const getAdminUserDirectory = async ({ email, page }: AdminUserDirectoryInput = {}) => {
  await requireAdmin();

  const emailSearch = normalizeEmailSearch(email);
  const requestedPage = normalizePage(page);
  const where = emailSearch
    ? {
        email: {
          contains: emailSearch,
          mode: "insensitive" as const,
        },
      }
    : undefined;

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const items: AdminUserDirectoryRow[] = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      trustLevel: true,
      accounts: {
        select: {
          providerId: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (currentPage - 1) * ADMIN_USERS_PAGE_SIZE,
    take: ADMIN_USERS_PAGE_SIZE,
  });

  return {
    items,
    total,
    page: currentPage,
    totalPages,
    emailSearch,
  };
};
