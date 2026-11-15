# Tasks

## 1. Schema and migration

- [x] 1.1 Mark `feature-142-outdoor-workout-route-primary` as `In Progress` in the `P0 Now` table of `openspec/backlog.md`; verify the row renders with the same columns as its neighbours.
- [x] 1.2 Add the `TrackGeometry` model, `Track.geometries`, and `FileAsset.trackGeometry` to `prisma/schema.prisma`; verify `npx prisma validate` and `npx prisma generate` pass.
- [x] 1.3 Create and apply the forward migration for the table, unique index on `fileAssetId`, `trackId` index, and both foreign keys (`Cascade` track, `Restrict` file asset); verify `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` prints an empty script.

## 2. Data layer

- [x] 2.1 Extend `attachRouteToTrack` in `app/_data/tracks.ts` with the `READY` file-owned demotion branch (validate ownership and an active `TRACK_GPX` file, create the `TrackGeometry` row with the moved metadata, then clear `fileAssetId`/`metadata` and set `routeId` in one transaction); verify the draft branch behavior is unchanged and `npm run tsc` passes.
- [x] 2.2 Add the route-replacement branch for a `READY` route-primary track: update `routeId` only and leave secondary rows untouched; `npm run tsc` passes, and the runtime `SELECT` check is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 2.3 Keep `resolveTrackGeometry` primary-only and add `canManageRoute`, `hasPrimaryRoute`, and the `secondaryFiles` collection to the public detail projection, with the existing download eligibility gate per file; verify `npm run tsc` and inspect the public detail payload for both a file-based and a route-primary track.
- [x] 2.4 Update `deleteTrack` to collect secondary file asset ids before deletion and mark them `PENDING_DELETE` with `deletedAt` in the transaction, while leaving the route's file untouched; `npm run tsc` passes, and the runtime `SELECT` check is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 2.5 Confirm public listings do not select secondary files or the new owner flags; verify `getPublicTracks` output and the shared table payload are unchanged.

## 3. Route editor reference geometry

- [x] 3.1 Add optional `backgroundPoints` and an accessible label to `components/track-pages/track-editor-map.tsx`; render a muted dashed polyline that is not clickable or draggable and use its bounds as the initial view when fewer than two points are placed; the browser open check is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 3.2 Thread the prop through `components/track-pages/track-editor.tsx` and `components/track-pages/route-form-dialog.tsx`; `npm run tsc` passes, and the existing `/my/routes` and quick route walk browser regression is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.

## 4. Owner attach flow on the public track page

- [x] 4.1 Load the owner's routes on `app/(public)/tracks/[slug]/page.tsx` only when the viewer owns the track; verify a non-owner request never loads or receives the route list.
- [x] 4.2 Add the client route control (`Attach route`/`Change route` label per `hasPrimaryRoute`) and its dialog with the existing-route select, **Create new route** action, the saved place picker, and the reference line; the owner-only visibility browser check is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 4.3 Wire the shared `ConfirmDialog` before the write, naming the new map/distance source and the file's move to the original-recording section; the cancel-writes-nothing browser check is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 4.6 Add the `attachRoute` copy block to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`; verify no raw keys appear in either language.

## 5. Public display and lifecycle

- [x] 5.1 Render the secondary-file section on `app/(public)/tracks/[slug]/page.tsx` under the primary file block, with name, size, upload/update times, and a download link for active public/unlisted assets or the viewer's own files, otherwise the existing unavailable wording; the owner/public/private browser matrix is deferred to `feature-142-outdoor-workout-route-primary-manual-qa`.
- [x] 5.6 Add the public-header recording fallback: when the primary route has no timed summary, show the preserved `recordingStartAt` and derive the finish from `recordingDurationSeconds`; verify the start and finish render on a route-primary workout and `npm run tsc` passes.

## 6. Integration checks

- [x] 6.1 Run `npm run tsc` and `npx openspec validate feature-142-outdoor-workout-route-primary --strict`; verify both pass.
- [x] 6.2 Run `npm run lint` plus targeted `npx eslint` on every changed file under `components`, `app`, and `lib`; verify no new warnings.
- [x] 6.3 Ask the owner to run `npm run build` locally and report the result; record it in this change before archiving. Local production build passed on 2026-11-14.
- [x] 6.4 Defer the remaining browser and data checks to the `feature-142-outdoor-workout-route-primary-manual-qa` row in `openspec/backlog.md`; the owner confirmed the happy path (attach route, map/distance switch, recording header, owner download buttons) on 2026-11-15.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec with the `openspec-sync-specs` skill after the owner accepts the implementation.
- Report unchecked tasks, then archive with the `openspec-archive-change` skill.
- Update the archived change summary and the backlog row.
