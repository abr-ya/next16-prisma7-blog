# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-tracks/spec.md` for the required behavior.

Today `Track` is the workout and its single geometry source. `Track_geometry_source_check` requires exactly one of `fileAssetId` or `routeId` on a `READY` row, and `resolveTrackGeometry` (`lib/track-geometry.ts`) resolves maps, downloads, trip views, and tables through that one source. `feature-141` added `geometryState` (`PENDING` / `READY`) and explicitly deferred demoting a file when a route is attached. Route creation already exists in `createRouteFromPoints`, the shared `TrackEditor` / `TrackEditorMap` already places and reorders points, and `RouteFormDialog` already supports a caller-provided `onCreated`. The draft dialog shows the desired two-step pattern: it renders `RouteFormDialog` as a sibling dialog and attaches the returned route id.

## Goals / Non-Goals

**Goals:**

- Let a file-based `READY` workout take a route as its primary geometry without losing its recording file, and let the owner replace that route later without disturbing the secondary file.
- Put the action where the owner sees the map it changes: the published track page, gated to the owner.
- Keep every existing read path working through `resolveTrackGeometry` without knowing about secondary files.
- Reuse the shared route editor and its saved-place picker instead of building a second placement UI.
- Preserve the visibility gate on file downloads; the app-owned file route stays the only download surface.

**Non-Goals:**

- Multiple secondary files, per-file removal, and primary selection when no route exists (`feature-143`).
- Detaching a route or promoting a secondary file back to primary; only replacement is supported.
- Renaming, re-parsing, or point cleanup on a secondary file.
- Attaching from a draft workout or from the owner tables; drafts are attached after publication.
- Administrator cross-user attach.
- Public listing changes or a public secondary-file badge.

## Decisions

### 1. Add a `TrackGeometry` table that only stores secondary files

```prisma
model TrackGeometry {
  id          String    @id @default(uuid())
  trackId     String
  track       Track     @relation(fields: [trackId], references: [id], onDelete: Cascade)
  fileAssetId String    @unique
  fileAsset   FileAsset @relation(fields: [fileAssetId], references: [id], onDelete: Restrict)
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt

  @@index([trackId])
}
```

Add `Track.geometries TrackGeometry[]` and `FileAsset.trackGeometry TrackGeometry?`. The table holds no `isPrimary` flag: in this slice a row is secondary by definition. The primary source stays `Track.fileAssetId` or `Track.routeId`, so `Track_geometry_source_check`, `resolveTrackGeometry`, trip views, and every table keep their current contract. `feature-143` can promote a row later by swapping its file and metadata into `Track.fileAssetId` and deleting the row, or add an explicit primary pointer if that proves cleaner.

`fileAssetId` is `@unique`: one GPX file can back at most one track or route, matching the existing `Track.fileAssetId` rule and `ensureEligibleTrackFileAsset`. `metadata` keeps the parse result that belonged to the file, so the demotion is lossless and needs no re-parse. An empty metadata value is stored as SQL `NULL` (`Prisma.DbNull`), not JSON `null`.

Alternative considered: make `Track.fileAssetId` non-unique and add a role column. Rejected because it would weaken the exactly-one-primary rule and force every query to filter by role.

### 2. Extend `attachRouteToTrack` with demotion and route-replacement branches

The existing action already owns route ownership checks, revalidation, and the draft branch. Extend it instead of adding a second action:

- `PENDING` → existing behavior: set `routeId`, clear file/metadata, `READY`, `timeSource = "MANUAL"`.
- `READY` with `fileAssetId` and no `routeId` → demotion:
  1. validate the file asset is `TRACK_GPX` and `ACTIVE`;
  2. in one transaction, create the `TrackGeometry` row with the track's current `fileAssetId` and `metadata`, then update the track with `routeId`, `fileAssetId = null`, `metadata = null`;
  3. leave `geometryState = "READY"`, `timeSource`, `recordingStartAt`, `recordingDurationSeconds`, `recordingTimezone`, and every presentation field untouched.
- `READY` with `routeId` and no `fileAssetId` → replacement: update `routeId` only. Secondary `TrackGeometry` rows stay exactly as they are.
- Anything else → `VALIDATION` with a message naming the expected state.

The create-then-clear order keeps the file referenced at every point inside the transaction, so the `Restrict` foreign keys stay satisfied. Revalidation stays `revalidateTrackPaths()`, `/my/workouts`, `/my/tracks`, and `/my/routes` (the former and new route report linked-track counts).

No new trust gate: attaching an existing route edits an existing track, like `updateTrack`; route creation keeps its own `requireTrustGatedAction("track-upload")` inside `createRouteFromPoints`. No quota is consumed because no track row is added.

Alternative considered: separate `demoteTrackFileToRoute` action. Rejected because the eligibility check, ownership check, and revalidation would be duplicated, and callers would have to choose an action based on state.

### 3. Entry point is the owner's published track page

The public detail page already reads the viewer session, selects `userId` and `routeId`, and includes `parsed.mapGeometry`. Expose two flags on `PublicTrack`:

```ts
canManageRoute: boolean;   // viewer is the track owner
hasPrimaryRoute: boolean;  // track.routeId !== null
```

The page renders a client `TrackRouteControl` next to the file block only when `canManageRoute` is true. It shows **Attach route** for a file-based track and **Change route** for a route-primary track. The control owns the dialog state and receives the track id, title, `hasPrimaryRoute`, the current `parsed.mapGeometry` as the overlay, and the owner's routes.

`/tracks/[slug]` is the only entry point. Because `getPublicTrackBySlug` only resolves `PUBLISHED` `READY` rows, a draft has no page and no control: the owner publishes first, attaches the route, and may unpublish afterwards. That is an accepted limitation of this slice, recorded in Risks; an owner-facing draft detail page is the separate `outdoor-my-track-detail-page` candidate.

The page loads the owner's routes on the server only when `canManageRoute` is true (`getOwnerRoutes`), so other viewers never receive the route list. The new client dialog reuses the shared `ConfirmDialog` before writing: the confirmation names the new map/distance source and states that the current file stays available as the original recording. Nothing is written until confirm.

Alternative considered: a row action on `/my/tracks`. Rejected after the entry-point discussion: the owner changes geometry while looking at the map it affects, and the route control sits with the existing owner-only file actions.

### 4. Overlay is an optional background line on the shared editor

Add an optional `backgroundPoints?: TrackGpxCoordinate[]` (plus an accessible label) to `TrackEditor` and `TrackEditorMap`. The map draws it as a muted dashed polyline (`#94a3b8`, weight 2, dash `4 6`) before the editable points; it is not clickable or draggable. When fewer than two points are placed, the initial bounds come from the background line so the editor opens on the recording; once two points are placed, the existing point bounds take over. `RouteFormDialog` forwards the prop; the saved route contains only `points`, never the reference.

The reference comes from the track's `parsed.mapGeometry`, which the public detail query already loads and simplifies for the map. For a file-based workout it shows the recording; for a route-replacement flow it shows the current route shape. If geometry is unavailable, the prop is `undefined` and the map opens without a line. No extra server action or payload is needed.

Alternative considered: render a second read-only map beside the editor. Rejected because the owner needs the recorded shape in the same projection as the points being placed.

### 5. Secondary files are projected separately; primary resolution is unchanged

Add `geometries` to the public detail select only. `toPublicTrack` keeps `file`, `parsed`, and `map` from `resolveTrackGeometry` and adds:

```ts
secondaryFiles: Array<{
  id: string;
  name: string;
  sizeBytes: number;
  uploadedAt: Date;
  updatedAt: Date;
  downloadUrl: string | null;
  downloadAvailable: boolean;
}>;
```

The public page renders a separate section under the primary file block with one row per secondary file: name, size, upload/update times, and **Download GPX** when the asset is active and either its visibility is `PUBLIC` or `UNLISTED` or the viewer owns it; otherwise the existing "download is unavailable" wording. The owner-aware branch matches the server, which authorizes the owner for a private file; an anonymous visitor or another user stays behind the visibility gate. The app-owned `/files/[fileId]/download` route stays the only download path, so the server remains the authority and no provider URL is exposed. With the route primary, the existing file block shows the route's private synthetic GPX and the same owner-aware state; the new section names the original recording.

Public listings do not select `geometries`, so list payloads and the shared table stay unchanged. The owner table's file cell keeps showing the primary file.

feature-139's header reads the primary geometry's parsed summary. A route-primary track's synthetic GPX has no `<time>` values, so the page falls back to the preserved `recordingStartAt` and `recordingDurationSeconds` and derives the finish; the workout tables already use the same chain. The helper lives in `lib/track-effective-values.ts` so the page and tables cannot drift.

### 6. Cleanup policy: retire on track delete, no per-file actions

`deleteTrack` collects secondary `fileAssetId`s before deleting the track, then marks both the primary self-owned file (existing branch) and every collected secondary asset `PENDING_DELETE` with `deletedAt` in the same transaction. The cascade removes `TrackGeometry` rows; the assets stay as terminal markers, matching `fix-013` and route deletion. A route's own file is never touched because it belongs to the route, not the track.

The rename and point-cleanup actions stay primary-file-only (`canRenameFile` / `canCleanPoints` already require `!routeId`). A route-primary track therefore offers neither, and their server actions keep rejecting it. `feature-143` owns per-file removal and any per-file editing decisions.

### 7. Copy and localization

New owner-side copy goes into the existing `trips` namespace (`app/i18n/locales/{en,ru}/trips.json`) under an `attachRoute` block: control label, dialog title and description, confirmation copy, route select label and placeholder, attach/change/create labels, empty-library hint, and success toast. Action error messages stay plain strings like the rest of the track actions and surface through the existing toast. The public secondary-file section follows the page's current English wording, consistent with the rest of `/tracks/[slug]`; the shared `ConfirmDialog` keeps its English default cancel label, matching its other call sites.

## Risks / Trade-offs

- [A published workout's public download could silently disappear] → Secondary files are shown publicly under the same asset-visibility rules, so an attachment does not hide an already public file.
- [Two sources on one workout confuse readers] → The primary block keeps its existing meaning (route geometry); the secondary section is explicitly labeled as the original recording.
- [A draft cannot attach a route] → Accepted in this slice: the owner publishes first, attaches, and may unpublish. The private draft detail page is the separate `outdoor-my-track-detail-page` candidate.
- [A partial create-then-attach leaves an unused route] → The route stays in the owner's library and the error message points to retrying; no destructive rollback.
- [Secondary rows on a file-primary track are possible in the schema] → Only actions write rows in this slice, and `feature-143` will own the file-primary multi-file case; no DB check is added prematurely.
- [Public payload grows] → Only the detail query selects secondary files; listings stay unchanged, and the row count is one in this slice.
- [The overlay comes from the currently parsed geometry] → It is the same simplified line the public map uses; when it is missing the map still works, and the reference is never saved.
- [Secondary metadata is not reparsed] → It is moved verbatim with the file, so the parse result remains exactly what the file produced.
- [Replacing a route could point the workout at an unrelated shape] → The confirmation names the public change, and the secondary recording stays untouched so the owner can replace the route again.

## Migration Plan

1. Add the `TrackGeometry` model and its relations to `Track` and `FileAsset`.
2. Create a forward migration with the table, unique index on `fileAssetId`, index on `trackId`, and the two foreign keys (`Cascade` on track, `Restrict` on file asset).
3. Deploy the data layer and UI. No backfill: existing tracks have no secondary files, and existing route-based tracks keep working.
4. Validate with `npx prisma validate`, `npx prisma generate`, and `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`.

Rollback: drop the table and relations. No existing column or row changes, so the rollback needs no data repair; any track that took a route in the meantime keeps the route and loses only its secondary row (its file asset would then be unreferenced and must be retired manually).

## Open Questions

None that change scope. `feature-143` decides whether secondary files can be reordered, renamed, removed individually, or promoted to primary.
