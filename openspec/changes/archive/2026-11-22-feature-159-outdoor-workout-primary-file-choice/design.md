# Design

## Context

`feature-143` added the owner list of secondary files: `TrackGeometry` rows that carry a file and its parsed metadata. The track's primary source is still exactly one of `Track.fileAssetId` (own file) or `Track.routeId` (route), enforced by `Track_geometry_source_check`. `resolveTrackGeometry` reads the primary, so the map, distance, time, moving time, and photo inference all follow it.

Promotion is therefore a swap between two existing sources, not a new file operation.

## Action

`makeTrackPrimaryFile(geometryId)` in `app/_data/tracks.ts`, owner-scoped:

1. Load the geometry through its track with the owner scope, including the target file, the target metadata, and the track's current `fileAssetId`, `metadata`, `routeId`, `geometryState`, and slug.
2. Guard with the same `canChangePrimaryFile` rule the payload uses: `routeId === null`, `READY`, the track's own active `TRACK_GPX` file, the target geometry belongs to this track, and its file is active.
3. In one transaction:
   - delete the target `TrackGeometry` row, which frees its file for the primary slot;
   - create a `TrackGeometry` row for the current primary file with the current track metadata;
   - update the track to the target file and metadata.
4. Revalidate the detail path, then call the existing `parseTrackGpx(track.id)` so the mirrored recording start, duration, timezone, and capability marker are refreshed from the newly primary file. The parser preserves `timeSource` and lets a confirmed timezone win, exactly as after an upload.
5. Return `{ ok: true }`, or a readable failure when the reparse did not succeed. A failed reparse leaves the swap in place, because the files are already the ones the owner chose, and the general **Update track data** action remains the recovery path.

No trust gate is added: no file is uploaded and no quota is consumed. The owner already owns both files.

## Invariants

- The transaction never leaves the track with zero sources and never puts the same file in both the primary and a geometry, because the target row is deleted before the old primary row is created.
- A route-primary track is refused before any write.
- A pending draft has no primary file and is refused.
- The previous primary's metadata travels with it into `TrackGeometry`, so the old file keeps its own map line as a secondary recording.

## Read Model

`PublicTrack` gains `canChangePrimaryFile`: the viewer owns the track, the track has no route, it is `READY`, it has its own active `TRACK_GPX` file, and `secondaryFiles.length > 0`. The action receives the `geometryId` the list already carries.

## UI

In `TrackExtraFilesSection`, each secondary file gets a **Make primary** action when `canChangePrimaryFile` is true. It opens a `ConfirmDialog` explaining that the file becomes the source of the map, distance, time, and photo inference while the current primary becomes an extra file. Confirming calls the action, toasts the outcome, and refreshes the page; a failed reparse shows its message but the refreshed list already reflects the swap.

The current primary file section stays as it is; the action only lives on the secondary rows.

## Risks

- **Confusing statistics jump.** The distance and time change because they now describe the chosen file; the confirmation copy states this explicitly.
- **Failed reparse after a successful swap.** The old primary is already a secondary and the new primary may have failed metadata; the action reports it and the parse status row offers **Update track data**.
- **Route-primary expectations.** The action is absent, not disabled-with-reason, because a route is deliberately the primary in that shape.
- **Photo inference changes.** It reads the primary timeline, so a promotion can move photo inference to the newly chosen file; this is the intended meaning of "primary".
- **Concurrent promotion.** Two simultaneous promotions can interleave; the transaction keeps the invariants, and the last write wins. Rare and acceptable without extra locking.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx openspec validate --changes --strict`, and a production build. Browser checks are deferred to a manual QA candidate: promote a secondary file on an owned route-less workout, confirm the map/distance/time switch, the old primary becomes the secondary, the action is absent on a route-primary workout, and a foreign geometry is refused. No schema change and no data is created during verification.
