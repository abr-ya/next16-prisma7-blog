import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { AUTH_ROLES, DEFAULT_AUTH_ROLE, hasAdminRole } from "./auth-roles";
import prisma from "./prisma";

/** Current session or `null` if the user is not signed in. Does not throw for missing session. */
export const authSession = async () => {
  return await auth.api.getSession({ headers: await headers() });
};

export const requireAuth = async () => {
  const session = await authSession();

  if (!session) redirect("/sign-in");

  return session;
};

export const currentUserRole = async () => {
  const session = await authSession();

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role ?? DEFAULT_AUTH_ROLE;
};

export const requireAdmin = async () => {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!hasAdminRole(user?.role)) redirect("/");

  return {
    ...session,
    user: {
      ...session.user,
      role: user?.role ?? AUTH_ROLES.USER,
    },
  };
};

export const requireNoAuth = async () => {
  const session = await authSession();

  if (session) redirect("/");
};
