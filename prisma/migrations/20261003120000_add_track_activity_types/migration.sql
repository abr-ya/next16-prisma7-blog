CREATE TABLE "TrackActivityType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackActivityType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackActivityType_key_key" ON "TrackActivityType"("key");
CREATE INDEX "TrackActivityType_isActive_idx" ON "TrackActivityType"("isActive");

ALTER TABLE "Track" ADD COLUMN "activityTypeId" TEXT;
CREATE INDEX "Track_activityTypeId_idx" ON "Track"("activityTypeId");
ALTER TABLE "Track" ADD CONSTRAINT "Track_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "TrackActivityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "TrackActivityType" ("id", "key", "name") VALUES
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b01', 'walking', 'Walking'),
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b02', 'running', 'Running'),
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b03', 'cycling', 'Cycling'),
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b04', 'skiing', 'Skiing'),
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b05', 'rowing', 'Rowing'),
  ('f2ef4d7d-4e72-4d90-8022-2f1b6c7c9b06', 'other', 'Other')
ON CONFLICT ("key") DO NOTHING;
