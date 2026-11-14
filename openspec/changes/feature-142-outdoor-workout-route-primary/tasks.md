# Tasks

## 1. Schema and migration

- [ ] 1.1 Mark `feature-142-outdoor-workout-route-primary` as `In Progress` in the `P0 Now` table of `openspec/backlog.md`; verify the row renders with the same columns as its neighbours.
- [ ] 1.2 Add the `TrackGeometry` model, `Track.geometries`, and `FileAsset.trackGeometry` to `prisma/schema.prisma`; verify `npx prisma validate` and `npx prisma generate` pass.
- [ ] 1.3 Create and apply the forward migration for the table, unique index on `fileAssetId`, `trackId` index, and both foreign keys (`Cascade` track, `Restrict` file asset); verify `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` prints an empty script.

## 2. Data layer

- [ ] 2.1 Extend `attachRouteToTrack` in `app/_data/tracks.ts` with the `READY` file-owned demotion branch (validate ownership and an active `TRACK_GPX` file, create the `TrackGeometry` row with the moved metadata, then clear `fileAssetId`/`metadata` and set `routeId` in one transaction); verify the draft branch behavior is unchanged and `npm run tsc` passes.
- [ ] 2.2 Add the route-replacement branch for a `READY` route-primary track: update `routeId` only and leave secondary rows untouched; verify a replacement updates the route and preserves the `TrackGeometry` row with a direct `SELECT`.
- [ ] 2.3 Keep `resolveTrackGeometry` primary-only and add `canManageRoute`, `hasPrimaryRoute`, and the `secondaryFiles` collection to the public detail projection, with the existing download eligibility gate per file; verify `npm run tsc` and inspect the public detail payload for both a file-based and a route-primary track.
- [ ] 2.4 Update `deleteTrack` to collect secondary file asset ids before deletion and mark them `PENDING_DELETE` with `deletedAt` in the transaction, while leaving the route's file untouched; verify with a throwaway route-primary workout and a read-only `SELECT status FROM "FileAsset" WHERE id = ...`.
- [ ] 2.5 Confirm public listings do not select secondary files or the new owner flags; verify `getPublicTracks` output and the shared table payload are unchanged.

## 3. Route editor reference geometry

- [ ] 3.1 Add optional `backgroundPoints` and an accessible label to `components/track-pages/track-editor-map.tsx`; render a muted dashed polyline that is not clickable or draggable and use its bounds as the initial view when fewer than two points are placed; verify the new-route dialog opens on the current shape.
- [ ] 3.2 Thread the prop through `components/track-pages/track-editor.tsx` and `components/track-pages/route-form-dialog.tsx`; verify existing `/my/routes` creation and the quick route walk render without a reference line and `npm run tsc` passes.

## 4. Owner attach flow on the public track page

- [ ] 4.1 Load the owner's routes on `app/(public)/tracks/[slug]/page.tsx` only when the viewer owns the track; verify a non-owner request never loads or receives the route list.
- [ ] 4.2 Add the client route control (`attached`/`change` label per `hasPrimaryRoute`) and its dialog with the existing-route select, **Create new route** action, the saved place picker, and the reference line; verify the control appears only for the owner.
- [ ] 4.3 Wire the shared `ConfirmDialog` before the write, naming the new map/distance source and the file's move to the original-recording section; verify nothing is written when the dialog is cancelled.
- [ ] 4.4 Verify in the browser: attach an existing route to a file-based published workout, then change it to a different route; confirm the map, distance, and point count follow the route, the recording start/duration/timezone and status stay unchanged, and the secondary file survives both operations.
- [ ] 4.5 Verify the new-route path: place points over the reference line, save, confirm the route is stored with only the placed points and is linked to the workout.
- [ ] 4.6 Add the `attachRoute` copy block to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`; verify no raw keys appear in either language.

## 5. Public display and lifecycle

- [ ] 5.1 Render the secondary-file section on `app/(public)/tracks/[slug]/page.tsx` under the primary file block, with name, size, upload/update times, and a download link only for active public/unlisted assets, otherwise the existing unavailable wording; verify with a public and a private secondary file.
- [ ] 5.2 Verify an anonymous visitor and a non-owner see the same secondary-file rows and no provider URL, no route control, and that a track without secondary files renders no empty section.
- [ ] 5.3 Verify the route-primary page offers no rename control and no point-cleanup action, and that direct rename/cleanup requests for that track are rejected without changing files.
- [ ] 5.4 Delete a route-primary workout in the browser and verify the secondary file asset becomes `PENDING_DELETE` while the shared route and its file stay active for another linked workout.
- [ ] 5.5 Verify a draft workout has no public page and no attach control; publish a ready file-based draft, attach a route, and confirm the route can be changed after publication.

## 6. Integration checks

- [ ] 6.1 Run `npm run tsc` and `npx openspec validate feature-142-outdoor-workout-route-primary --strict`; verify both pass.
- [ ] 6.2 Run `npm run lint` plus targeted `npx eslint` on every changed file under `components`, `app`, and `lib`; verify no new warnings.
- [ ] 6.3 Ask the owner to run `npm run build` locally and report the result; record it in this change before archiving.
- [ ] 6.4 Ask the owner to complete the browser QA pass for: attach existing route, change route, create route with the reference line, confirmation cancel, published-only gating, public/private secondary download, delete cleanup, and the absent rename/cleanup controls; record any failure as a separate `fix-XXX` candidate.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec with the `openspec-sync-specs` skill after the owner accepts the implementation.
- Report unchecked tasks, then archive with the `openspec-archive-change` skill.
- Update the archived change summary and the backlog row.
