-- Add Better Auth Admin plugin fields
ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "banReason" TEXT;
ALTER TABLE "user" ADD COLUMN "banExpires" TIMESTAMP(3);

ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;
