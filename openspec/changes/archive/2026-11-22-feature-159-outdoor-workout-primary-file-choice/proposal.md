# Proposal

## Why

`feature-143` lets an owner keep several GPX files on one workout, but the file that happened to be uploaded first stays the primary geometry forever. When the second file is the better recording — a full ride versus a partial watch export — the owner can remove files but cannot say which one the map, distance, time, and photo inference should use.

This slice adds the missing half: promote a secondary file to primary when the workout has no route.

## What Changes

- Add an owner action that promotes one attached secondary file to the track's primary geometry and moves the current primary into the secondary list.
- Keep the `file-XOR-route` invariant: a route-primary workout never offers the action, and a route is never replaced by a file here.
- Swap the primary file and its parsed metadata in one transaction; refresh the mirrored recording columns, timezone, and the capability marker through the existing parse path.
- Reparse a failed promotion honestly: the swap may stand, but the action reports the failure and the general **Update track data** action remains available.
- Add a `canChangePrimaryFile` flag to the public detail payload and a **Make primary** action to the extra-files section.
- No schema change and no migration: `TrackGeometry` and `Track.fileAssetId` already express the swap.

## Non-goals

- Choosing a primary when the workout's geometry is a route; the route stays primary.
- Reordering or labelling secondary files.
- Changing the primary from the administrative track table.
- Automatic promotion based on distance or parse quality.
- Any change to how secondary files are added or removed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the owner promotes a secondary GPX file to primary on a route-less workout, and the statistics and map follow the chosen file.

## Impact

- `app/_data/tracks.ts` — the promotion action, its guards, the transactional swap, and the payload flag.
- `components/track-pages/track-extra-files-section.tsx` — the **Make primary** control and its confirmation.
- No schema, migration, API, or dependency changes.
