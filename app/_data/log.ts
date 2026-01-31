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
