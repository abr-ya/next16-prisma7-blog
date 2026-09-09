CREATE TYPE "HikeParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "HikeParticipant" (
    "id" TEXT NOT NULL,
    "hikeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "HikeParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HikeParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HikeParticipant_hikeId_userId_key" ON "HikeParticipant"("hikeId", "userId");
CREATE INDEX "HikeParticipant_userId_status_idx" ON "HikeParticipant"("userId", "status");
CREATE INDEX "HikeParticipant_hikeId_status_idx" ON "HikeParticipant"("hikeId", "status");
CREATE INDEX "HikeParticipant_invitedById_idx" ON "HikeParticipant"("invitedById");

ALTER TABLE "HikeParticipant" ADD CONSTRAINT "HikeParticipant_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HikeParticipant" ADD CONSTRAINT "HikeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HikeParticipant" ADD CONSTRAINT "HikeParticipant_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
