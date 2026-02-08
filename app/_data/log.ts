"use server";

import type { LogAction } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const createLogEvent = async (action: LogAction | string, details?: string) => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const log = await prisma.log.create({
      data: {
        action,
        details,
        userId: session.user.id,
      },
    });

    return log;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

/** Log when a user loads/views an image in the rich text viewer. Only logs when user is authenticated. */
export const logImageViewed = async (imageUrl: string) => {
  try {
    const session = await authSession();
    if (!session) return;

    await prisma.log.create({
      data: {
        action: "viewImage",
        userId: session.user.id,
        details: JSON.stringify({ imageUrl, viewedAt: new Date().toISOString() }),
      },
    });
  } catch (err) {
    console.error("Failed to log image view:", err);
  }
};
