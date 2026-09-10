import "server-only";

import { authSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export type PendingProfileInvitation = {
  id: string;
  invitedAt: Date;
  hike: {
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
  };
};

export type CurrentUserProfile = {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  contentCounts: {
    posts: number;
    trips: number;
    tracks: number;
    photos: number;
  };
  invitations: PendingProfileInvitation[];
};

export const getCurrentUserProfile = async (): Promise<CurrentUserProfile | null> => {
  const session = await authSession();

  if (!session) return null;

  const userId = session.user.id;
  const now = new Date();

  await prisma.hikeParticipant.updateMany({
    where: { userId, status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED", respondedAt: now },
  });

  const [user, posts, trips, tracks, photos, invitations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true },
    }),
    prisma.post.count({ where: { userId } }),
    prisma.hike.count({ where: { userId } }),
    prisma.track.count({ where: { userId } }),
    prisma.photo.count({ where: { userId } }),
    prisma.hikeParticipant.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { invitedAt: "desc" },
      select: {
        id: true,
        invitedAt: true,
        hike: { select: { title: true, slug: true, startDate: true, endDate: true } },
      },
    }),
  ]);

  if (!user) return null;

  return {
    user,
    contentCounts: { posts, trips, tracks, photos },
    invitations,
  };
};
