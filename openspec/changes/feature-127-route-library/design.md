# Design

## Context

`Track` (`prisma/schema.prisma:343`) is one row for both the geometry and the training:

- geometry — `fileAssetId` (required, unique, `onDelete: Restrict`) and `metadata` (parsed GPX JSON);
- training — `recordingStartAt`, `recordingDurationSeconds`, `recordingTimezone`, `timeSource`, `gearId`, `activityTypeId`;
- presentation — `title`, `slug` (unique), `description`, `status`, `kind`.

Two creation paths already exist:

- **Uploaded GPX** (`parseTrackGpx` and the quick-upload action): a real file arrives, it is parsed into `metadata`, and the recording columns are filled from the file. This is the main path and must not change.
- **Placed on a map** (`createManualTrack`, `app/_data/tracks.ts:1234`): the action builds a synthetic GPX from two or more placed points (`buildSyntheticGpxBytes`), uploads it with `purpose = TRACK_GPX`, writes a `Track` with `metadata: Prisma.JsonNull`, then parses it. `recordingStartAt` and `recordingDurationSeconds` are optional here.

So today the same route walked three times exists as three unrelated `Track` rows with three synthetic GPX files, and there is no object that says "this is the same shape".

## Decision: two geometry sources on `Track`, exclusive by constraint

**Chosen: a track either owns its geometry or reads it from one route. `Route` owns file and metadata; `Track` keeps a nullable link to it.**

```prisma
model Route {
  id          String   @id @default(uuid())
  title       String
  description String?
  fileAssetId String   @unique
  fileAsset   FileAsset @relation(fields: [fileAssetId], references: [id], onDelete: Restrict)
  metadata    Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      Track[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now()) @updatedAt

  @@index([userId])
}

model Track {
  // unchanged: title, slug, description, status, kind, timeSource,
  // recordingStartAt, recordingDurationSeconds, recordingTimezone,
  // activityTypeId, gearId, userId, timestamps
  fileAssetId String?    @unique
  fileAsset   FileAsset? @relation(fields: [fileAssetId], references: [id], onDelete: Restrict)
  metadata    Json?
  routeId     String?
  route       Route?     @relation(fields: [routeId], references: [id], onDelete: Restrict)
}
```

`fileAssetId` only loses non-nullability: `@unique` stays, and Postgres allows any number of `NULL`s in a unique column, so "one GPX file belongs to one track" survives. `FileAsset.track: Track?` is not touched. Nothing is dropped, and no existing row is rewritten — the migration is additive apart from one `ALTER COLUMN ... DROP NOT NULL`.

The invariant lives in the database, not only in actions:

```sql
ALTER TABLE "Track" ADD CONSTRAINT "Track_geometry_source_check" CHECK (
  ("routeId" IS NULL     AND "fileAssetId" IS NOT NULL)
  OR
  ("routeId" IS NOT NULL AND "fileAssetId" IS NULL AND "metadata" IS NULL)
);
```

The second branch requires `metadata` to be `NULL` for a route-based track: the geometry is the route's, and a copy on the track would immediately start drifting.

### Why not the alternatives

- *`Track.routeId` required for every track.* It would make the route the only owner of geometry and delete `Track.fileAssetId`/`metadata`. Cleaner in theory, but it rewrites every existing track into a route, forces `NOT NULL` on recording columns, and turns 100% of rows into library entries. Rejected: it breaks the main upload path for no gain the owner asked for.
- *Copy the metadata into the track at creation.* Keeps every read unchanged, but duplicates a JSON that can reach hundreds of kilobytes and creates a synchronization duty: a route edit would silently leave linked tracks stale. Rejected.
- *Share one `FileAsset` row between a route and its tracks.* Requires dropping `@unique` and turning `FileAsset.track` into a list, and still needs metadata copied or forked. Rejected.
- *A `legacy` flag for tracks made before this change.* There is nothing to mark: after migration each row is exactly one of the two shapes, and the shape is derivable from `routeId`.

## Geometry resolution

One helper in the data layer, used by every surface that needs a file or geometry:

```ts
type TrackGeometry = { fileAsset: FileAsset; metadata: Prisma.JsonValue | null };

// track.fileAsset ?? track.route.fileAsset
// track.metadata ?? track.route.metadata
```

The six files that read `track.fileAsset` or `track.metadata` today (`app/_data/tracks.ts`, `app/_data/hikes/queries.ts`, `app/_data/hikes/internal.ts`, `components/admin-pages/tracks-admin-panel.tsx`, `tracks-admin-panel-parse-cell.tsx`, `hikes-admin-panel.tsx`) switch to the helper or to an explicit `include` of `route: { include: { fileAsset: true } }`. Prisma cannot express the fallback in a `select`, so the mapping happens once per query, next to the `select`.

`metadata IS NULL` now means two things: "route-based" and "own file, not parsed yet". The discriminator is `routeId`, so the helper checks `routeId` first and never infers from `metadata`.

## Creation flows

**Uploaded GPX — unchanged.** The track gets its own `fileAssetId` and `metadata`; `routeId` stays `NULL`. No route is created, so the library is not filled with one-off shapes.

**Manual — create a route, then a track.**

1. Route: either place points on the existing map editor (the `createManualTrack` flow, now writing a `Route` with a synthetic GPX) or pick an existing route.
2. Track: `routeId` set, `fileAssetId` and `metadata` `NULL`, `timeSource = "MANUAL"`, and the form requires `recordingStartAt` and `recordingDurationSeconds` before submit.
3. The same route may back any number of tracks.

`timeSource` becomes derivable from `routeId` for new rows; removing the column is follow-up cleanup, not part of this change.

## Route edit and delete

Both are owned by `feature-128-my-routes-page`; this change only guarantees the rule they must respect: every linked track reads the route's geometry, so an edit reaches all of them and a delete with linked tracks is impossible.

- **Edit geometry**: more than one linked track → the dialog warns that the change applies to all of them; exactly one → no warning.
- **Delete**: `onDelete: Restrict` refuses while `tracks` is non-empty.
- **Delete a track**: leaves its route behind. No cascade, no orphan `FileAsset`.

## Delivery split

This change delivers the model and the creation path: schema, migration, geometry resolution, route creation from placed points, creation of a track from a route, and the three legacy conversions. The owner-facing library — `/my/routes`, listing with track counts, renaming, geometry editing, deletion, and the menu entry — is `feature-128-my-routes-page` and depends on this change.

## Legacy migration

Three existing rows were created by the map path and are converted in this change. The conversion creates the route and links the track; it never deletes a track row, so `Track` ids, slugs, recording data, and every foreign key (including `HikesToTracks`) stay valid:

| Slug | What happens |
| --- | --- |
| `po-nahimova-do-metro-sprava` | Route created from the track's file and metadata; track linked; `fileAssetId` and `metadata` cleared on the track |
| `na-primorskuyu-cherez-osenniy-marafon` | Same |
| `nabahino-na-stanciyu` | Same; this row already carries recording data, so it remains a complete track |

Route `title` is copied from the track title, `description` from the track description, `userId` from the owner, and `fileAssetId`/`metadata` move to the route. The check constraint is added **after** the conversion, so a missed row fails the migration loudly instead of leaving an invalid state.

## Risks

- `metadata` is now sometimes `NULL` for a track with its own file (parse not finished yet) and always `NULL` for a route-based track. Every read must branch on `routeId`, never on `metadata`.
- Route geometry is shared state: an administrator editing a route changes what several tracks display. That is the intended behavior and the reason for the warning, but it must be covered by a scenario in both specs.
- `FileAsset` deletion paths must keep working: a track file and a route file both use `onDelete: Restrict`, and the "pending delete" flow must not mark a file that a route still owns.
