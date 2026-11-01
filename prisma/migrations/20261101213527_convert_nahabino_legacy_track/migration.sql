-- feature-127: convert the third legacy map-placed track into a route. The
-- slug was typo'd in 20261101211920_add_route_model, so the track kept its own
-- geometry and no route. The track row stays: id, slug, recording data, and
-- HikesToTracks links are untouched.
INSERT INTO "Route" ("id", "title", "description", "fileAssetId", "metadata", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."title", t."description", t."fileAssetId", t."metadata", t."userId", t."createdAt", t."updatedAt"
FROM "Track" t
WHERE t."slug" = 'nahabino-na-stanciyu'
AND t."fileAssetId" IS NOT NULL;

-- feature-127: link the track and clear its own geometry in one statement.
-- The check constraint is already in force, so the intermediate state (route
-- linked while the file is still set) must never exist.
UPDATE "Track" t
SET "routeId" = r."id",
    "fileAssetId" = NULL,
    "metadata" = NULL
FROM "Route" r
WHERE r."fileAssetId" = t."fileAssetId"
AND t."slug" = 'nahabino-na-stanciyu'
AND t."routeId" IS NULL;
