# Design

## Context

`Track.fileAssetId` is nullable and unique. A track either owns a `TRACK_GPX` `FileAsset` or borrows a route's geometry through `routeId` (`Track_geometry_source_check`). `deleteTrack` currently performs `prisma.track.delete` and nothing else, so an owned file keeps `status = ACTIVE` with `FileAsset.track = null`. The download endpoint refuses non-`ACTIVE` files, so retiring the row is enough to stop a public URL from serving it.

`deleteRoute` and the new `cleanTrackPoints` already establish the retirement pattern: `status = PENDING_DELETE`, `deletedAt = now()`, never a hard delete of the provider object.

## Decisions

**One transaction, two writes.** `deleteTrack` becomes a `prisma.$transaction` that deletes the track and runs `fileAsset.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "PENDING_DELETE", deletedAt: new Date() } })`. The `status: "ACTIVE"` guard makes a second delete or an already-retired file a harmless no-op.

**Only own files are retired.** The lookup selects `fileAssetId` and `routeId`; a route-based track (or a row without a file) skips the retirement, leaving the route's GPX available to its other tracks.

**No provider deletion.** The project never calls `UTApi.deleteFiles`; `PENDING_DELETE` is the consistent retirement state and an operator can still inspect the row. Removing the object is a separate decision.

**Existing revalidation is sufficient.** `revalidateTrackPaths()` already refreshes `/admin/tracks`, `/my/tracks`, `/my/workouts`, `/admin/files`, `/tracks`, and `/hikes`.

## Risks / Trade-offs

- The provider object stays in storage. That matches route deletion and cleanup; a storage-reclaim job is out of scope.
- A `PUBLIC` file's direct link stops working immediately after deletion, which is the intended behavior but is a visible change for anyone holding the URL.
- If the transaction fails, neither the track nor the file changes.
