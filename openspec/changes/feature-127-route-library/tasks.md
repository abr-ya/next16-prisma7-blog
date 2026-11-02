# Tasks

## 1. Schema and migration

- [x] 1.1 Add the `Route` model to `prisma/schema.prisma` exactly as described in `design.md`: `title`, `description?`, `fileAssetId @unique` with `onDelete: Restrict`, `metadata Json?`, `userId` with `onDelete: Cascade`, `tracks`, `createdAt`, `updatedAt`, and an index on `userId`.
- [x] 1.2 Add `routeId String?` and the `route Route?` relation (`onDelete: Restrict`) to `Track`, and add the `routes Route[]` back-relation to `User`.
- [x] 1.3 Change `Track.fileAssetId` from `String @unique` to `String? @unique` and its relation to `FileAsset?`. Do not touch `FileAsset.track`.
- [x] 1.4 Add a forward migration: `CREATE TABLE "Route"`, the two foreign keys, the unique index on `Route.fileAssetId`, the index on `Route.userId`, `ALTER TABLE "Track" ALTER COLUMN "fileAssetId" DROP NOT NULL`, and `ALTER TABLE "Track" ADD COLUMN "routeId" TEXT`.
- [x] 1.5 Run `npx prisma validate` and `npx prisma generate`; confirm the generated client has `route` on `Track` and `fileAsset` optional.

## 2. Geometry resolution

- [x] 2.1 Add a `TrackGeometry` type and a `resolveTrackGeometry(track)` helper in `app/_data/tracks.ts` that returns `fileAsset` and `metadata`, preferring the track's own values and falling back to the route's. Branch on `routeId`, never on `metadata`.
- [x] 2.2 Add a shared `Prisma.validator` include (`fileAsset: true`, `route: { include: { fileAsset: true } }`) so every query that needs geometry selects the same shape.
- [x] 2.3 Switch `app/_data/tracks.ts` reads to the helper: public track page, admin track list, parse status, GPX download, and the time-summary selects.
- [x] 2.4 Switch `app/_data/hikes/queries.ts` and `app/_data/hikes/internal.ts` geometry reads to the helper, including the trip media map and track cards.
- [x] 2.5 Switch `components/admin-pages/tracks-admin-panel.tsx`, `tracks-admin-panel-parse-cell.tsx`, and `hikes-admin-panel.tsx` to the resolved values passed down from the data layer; no component should read `track.fileAsset` directly.
- [x] 2.6 Confirm the GPX download path serves the route file for a route-based track, and that a missing file still returns the existing not-found behavior.

## 3. Route data layer

- [x] 3.1 Add `createRouteFromPoints` in `app/_data/routes.ts`: validate the points, build the synthetic GPX (reuse `buildSyntheticGpxBytes`), upload it with `purpose = TRACK_GPX`, store the `Route`, and parse its metadata.
- [x] 3.2 Add `getOwnerRoutes()` returning each route with its linked track count, ordered newest first — the payload the track dialog's route picker consumes.
- [x] 3.3 Add `getRouteById(routeId)` for the dialog preview, so the picker shows the route's shape before a track exists.

## 4. Track creation from a route

- [x] 4.1 In `components/track-pages/track-editor.tsx`, split the dialog into route selection and training data: a **New route** option and a list of the owner's routes.
- [x] 4.2 Make `recordingStartAt` and `recordingDurationSeconds` required in this flow, with the existing localization and validation messages reused.
- [x] 4.3 Add `createTrackFromRoute` in `app/_data/tracks.ts`: set `routeId`, leave `fileAssetId` and `metadata` `NULL`, set `timeSource = "MANUAL"`, and reuse the existing slug, quota, trust, and activity-type checks.
- [x] 4.4 Keep the uploaded-GPX path untouched: it still writes `fileAssetId`, `metadata`, and no `routeId`.
- [x] 4.5 Remove the old place-points-on-a-map entry from track creation so a track can no longer be created without a route or an uploaded file; the editor's point placement moves behind route creation.

## 5. Legacy routes

- [x] 5.1 Convert `po-nahimova-do-metro-sprava`: create a `Route` from the track's `fileAssetId`, `metadata`, `title`, `description`, and `userId`; set `track.routeId`; clear `track.fileAssetId` and `track.metadata`.
- [x] 5.2 Convert `na-primorskuyu-cherez-osenniy-marafon` the same way.
- [x] 5.3 Convert `nabahino-na-stanciyu` the same way; its recording data stays on the track.
- [x] 5.4 Add the `Track_geometry_source_check` constraint from `design.md` after the conversion; it ships inside the same migration, after 5.1–5.3, so a missed row rolls the whole change back.
- [x] 5.5 Verify before adding the constraint that no `Track` row has both sources or neither: `SELECT count(*) FROM "Track" WHERE ("routeId" IS NULL) = ("fileAssetId" IS NULL);` must return `0`.
- [ ] 5.6 Confirm the three tracks resolve their geometry through their new routes on `/my/tracks`, `/admin/tracks`, and the public track page.

## 6. Validation

- [x] 6.1 `npm run tsc` — expect no type errors.
- [x] 6.2 `npx eslint app/_data/tracks.ts app/_data/routes.ts app/_data/hikes/queries.ts app/_data/hikes/internal.ts components/track-pages/track-editor.tsx components/admin-pages/tracks-admin-panel.tsx components/admin-pages/hikes-admin-panel.tsx --quiet` — expect no errors.
- [x] 6.3 `npm run lint` — expect no errors.
- [x] 6.4 `npx openspec validate feature-127-route-library --strict` — expect the change to validate.
- [ ] 6.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 7. Browser check (the owner's)

- [ ] 7.1 Create a track from a newly placed route, with a start time and a duration; confirm the track renders the route's geometry.
- [ ] 7.2 Create a second track from the same route and confirm both render the same geometry.
- [ ] 7.3 Upload a GPX file through the main path and confirm nothing about it changed: own file, own metadata, no route involved.
- [ ] 7.4 Open the three converted legacy tracks and confirm they render their geometry from their new routes.
