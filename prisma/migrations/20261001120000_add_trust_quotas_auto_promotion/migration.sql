-- Remove historical self-likes before they can count toward trust promotion.
DELETE FROM "PhotoLike" AS "like"
USING "Photo"
WHERE "like"."photoId" = "Photo"."id"
  AND "like"."userId" = "Photo"."userId";

-- Reconcile qualifying existing users during rollout and audit every promotion.
WITH promoted AS (
  UPDATE "user" AS owner
     SET "trustLevel" = 'TRUSTED'
   WHERE owner."trustLevel" = 'VERIFIED'
     AND (
       SELECT COUNT(*)
       FROM "PhotoLike" AS "like"
       JOIN "Photo" ON "Photo"."id" = "like"."photoId"
       WHERE "Photo"."userId" = owner."id"
         AND "like"."userId" <> owner."id"
     ) >= 10
  RETURNING owner."id"
)
INSERT INTO "TrustChangeLog" (
  "id", "targetUserId", "actorUserId", "fromLevel", "toLevel", "source", "createdAt"
)
SELECT
  md5(promoted."id" || clock_timestamp()::text || random()::text),
  promoted."id",
  NULL,
  'VERIFIED',
  'TRUSTED',
  'AUTO_PROMOTION',
  CURRENT_TIMESTAMP
FROM promoted;
