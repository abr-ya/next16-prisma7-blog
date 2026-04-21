import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Current session or `null` if the user is not signed in. Does not throw for missing session. */
export const authSession = async () => {
  return await auth.api.getSession({ headers: await headers() });
};

export const requireAuth = async () => {
  const session = await authSession();

  if (!session) redirect("/sign-in");

  return session;
};

export const requireNoAuth = async () => {
  const session = await authSession();

  if (session) redirect("/");
};
