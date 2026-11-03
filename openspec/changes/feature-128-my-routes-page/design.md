# Design

## Context

`feature-127-route-library` introduces `Route` (geometry + GPX file, no recording data) and links tracks to it. This change adds the owner-facing surface for that model. It is deliberately separate so the model change can be reviewed and shipped on its own: without this page the feature still works, because a route is created inside the track dialog.

The existing `/my/*` pages (`app/(public)/my/tracks`, `/my/workouts`, `/my/gear`) share a layout and a data-fetching style; `/my/routes` follows them rather than inventing a new pattern.

## Decisions

**List payload.** `getOwnerRoutes()` returns `id`, `title`, `description`, `createdAt`, `updatedAt`, `hasMetadata`, and `trackCount`. The count is a Prisma `_count` on `tracks`; the page does not load tracks themselves and does not load geometry.

**Preview.** A per-row **Preview** action opens a dialog with the route's shape. The dialog reads the route on demand through `getRoutePreview()` — a server action returning a `TrackMapViewModel` built with `toTrackMapViewModel(route.title, route.metadata)`, or `null` when the route has no parseable geometry — and renders the existing read-only `TrackMap`. Keeping the geometry out of the list payload avoids shipping every route's coordinates to the page and avoids one Leaflet instance per row.

**Editing.** Rename and description are inline actions. Geometry editing reuses `TrackEditor` from the track dialog, opening with the route's stored points.

**Geometry writes both halves.** A route's geometry lives in two places: the synthetic GPX in `FileAsset` (read by `resolveTrackGeometry` for maps, downloads, and trip views) and the parsed `metadata` (read for points, distance, and bounds). A geometry edit therefore rebuilds the GPX with `buildSyntheticGpxBytes`, uploads it with `uploadSyntheticTrackGpx`, creates a new `FileAsset`, repoints `route.fileAssetId`, and rewrites `metadata` with the new `sourceFileAssetId` / `fileKey`. The replaced `FileAsset` moves to `PENDING_DELETE` in the same transaction, and `revalidateTrackPaths()` runs afterwards because every linked track resolves its geometry through the route.

**Shared-track warning.** The update action returns `linkedTrackCount`; when it is greater than one the dialog requires an explicit confirmation before saving, and the copy names the number. One linked track needs no confirmation — that track is the route's only consumer. The server re-checks the count and refuses a geometry change without `confirmShared`, so the warning cannot be bypassed by a stale client.

**Deletion.** `deleteRoute` counts linked tracks first and returns a conflict result instead of letting a foreign key error escape. `onDelete: Restrict` on `Track.routeId` is the database backstop. The row shows the delete action disabled with the reason when the count is non-zero.

An unused route is deleted in one database transaction: the `Route` row goes away and its `FileAsset` is set to `PENDING_DELETE` with `deletedAt`. The project has no physical file deletion — `/admin/files` only marks assets — so this is the same lifecycle every other discard uses, and the owner sees one result: either both rows changed or neither did, with a readable message and a retry on failure.

**Menu.** `/my/routes` is added to the same user-menu definition as `/my/tracks` and `/my/workouts`, with the same access rule: signed-in owner only. No new permission.

**Localization.** The `/my/*` cluster and the user menu are not localized today: their page titles, table labels, and menu entries are hardcoded English, and only `dashboard` / `signout` come from `navigation.json`. Localizing `/my/routes` alone would put one Russian entry next to English siblings, so this change keeps the existing English convention and a separate follow-up feature localizes the whole owner workspace (menu plus `/my/tracks`, `/my/workouts`, `/my/gear`, and `/my/routes`) in one pass.

## Rejected alternatives

- *Put the library inside the track dialog.* It is where routes are first created, but rename and delete do not belong in a creation flow, and a dialog cannot show a growing library.
- *Allow deleting a route with tracks by detaching them first.* It would silently strip geometry from existing tracks; the owner must delete or relink those tracks deliberately.
- *Show the full track list per route.* The count answers the warning's question; a track list is a different surface and a different query.
- *Draw an SVG sparkline per row.* It needs every route's geometry in the list payload or a second query per row, and the preview dialog already answers the same question with the real map component.
- *Edit only `metadata` on a geometry change.* The GPX file and the parsed summary would disagree, and maps, downloads, and trip views would keep the old shape.
- *Hard-delete the route's `FileAsset`.* The project has no remote-delete path; dropping the row would orphan the UploadThing object without the `PENDING_DELETE` trail.
- *Localize `/my/routes` inside this change.* It would produce a mixed-language menu; the whole `/my/*` cluster is a separate slice.
