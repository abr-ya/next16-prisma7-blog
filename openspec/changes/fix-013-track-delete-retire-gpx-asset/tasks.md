# Tasks

## 1. Fix

- [ ] 1.1 In `app/_data/tracks.ts`, load `fileAssetId` and `routeId` in `deleteTrack` and wrap the delete plus the owned-file retirement in one `prisma.$transaction`.
- [ ] 1.2 Retire the file with `updateMany` filtered by `status: "ACTIVE"`, setting `PENDING_DELETE` and `deletedAt`; skip route-based tracks and missing files.
- [ ] 1.3 Keep the owner-scoped lookup and the existing `revalidateTrackPaths()` call.

## 2. Validation

- [ ] 2.1 `npm run tsc` — expect no type errors.
- [ ] 2.2 `npx eslint app/_data/tracks.ts --quiet` — expect no errors.
- [ ] 2.3 `npm run lint` — expect no new errors.
- [ ] 2.4 `npx openspec validate fix-013-track-delete-retire-gpx-asset --strict` — expect the change to validate.
- [ ] 2.5 `npm run build` — run locally by the owner.

## 3. Browser / manual check (the owner's)

- [ ] 3.1 Delete a track that owns its GPX and confirm it leaves the list and `/admin/files` shows the file as `PENDING_DELETE`.
- [ ] 3.2 Confirm the track's former direct `/files/<id>/download` link no longer serves the file.
- [ ] 3.3 Delete a route-based track and confirm the route's GPX still downloads.
