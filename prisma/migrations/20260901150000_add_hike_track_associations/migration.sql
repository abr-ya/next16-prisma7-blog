CREATE TABLE "HikesToTracks" (
    "hikeId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HikesToTracks_pkey" PRIMARY KEY ("hikeId","trackId")
);

CREATE INDEX "HikesToTracks_trackId_idx" ON "HikesToTracks"("trackId");

ALTER TABLE "HikesToTracks" ADD CONSTRAINT "HikesToTracks_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HikesToTracks" ADD CONSTRAINT "HikesToTracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
