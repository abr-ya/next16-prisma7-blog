# Proposal

## Why

Deleting a track leaves its GPX file behind. `deleteTrack` only removes the `Track` row, so the track's own `FileAsset` stays `ACTIVE` with no owner: it remains listed in `/admin/files`, keeps consuming storage, and a `PUBLIC` or `UNLISTED` download URL keeps serving the file by id after the track page is gone. Route deletion and the new point cleanup already retire their replaced files; track deletion is the remaining gap.

## What Changes

- In `deleteTrack`, delete the track and retire its own GPX file in one transaction: when the track references a `TRACK_GPX` `FileAsset` and that asset is `ACTIVE`, set it to `PENDING_DELETE` with `deletedAt`.
- Leave route-based tracks untouched: their geometry belongs to the `Route`, and the route's file must remain downloadable.
- Keep the existing owner scope (`where: { id, userId }`) and the existing revalidation, which already includes `/admin/files`.
- Do not call `UTApi.deleteFiles`: the project consistently retires provider objects through `PENDING_DELETE` rather than hard-deleting them.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the admin/owner track deletion requirement now states that the track's own GPX file is retired with the track, while route-based geometry is preserved.

## Impact

- `app/_data/tracks.ts`: `deleteTrack` becomes a transaction that also retires the track's own file asset.
- `openspec/specs/outdoor-tracks/spec.md`: the "Admin manages tracks" requirement's delete scenario changes; implementation gains no new query, schema, or route.
- No Prisma schema change, no migration, no upload/parse pipeline change, no UI change.

## Non-Goals

- Deleting the physical object from UploadThing storage. `PENDING_DELETE` remains the retirement state, matching `deleteRoute` and `cleanTrackPoints`.
- Cleaning up files that are already orphaned from earlier deletions. That needs a separate audit and is not part of this fix.
- Changing route deletion, track replacement, or the point-cleanup file lifecycle.
- Admin cross-user deletion; the existing owner-scoped lookup stays as it is.
