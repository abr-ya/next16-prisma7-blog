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

/** Rejection signal for action-scoped guards below. */
export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Signed-in user for server actions and route handlers; throws instead of redirecting. */
export const requireActionUser = async () => {
  const session = await authSession();

  if (!session) throw new AuthorizationError("Authentication required");

  return session.user;
};

const isAdminById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return hasAdminRole(user?.role);
};

/** Explicit administrator control check for actions (non-redirect counterpart of `requireAdmin`). */
export const requireAdminControl = async () => {
  const user = await requireActionUser();

  if (!(await isAdminById(user.id))) {
    throw new AuthorizationError("Administrator access required");
  }

  return user;
};

/**
 * Owner-or-admin scope check for audited workspace actions.
 * `ownerId` must come from a server-loaded record, never from client input.
 */
export const requireOwnerOrAdmin = async (ownerId: string | null | undefined) => {
  const user = await requireActionUser();

  if (ownerId && ownerId === user.id) return { user, isAdmin: false };
  if (await isAdminById(user.id)) return { user, isAdmin: true };

  throw new AuthorizationError("You can only manage your own content");
};
