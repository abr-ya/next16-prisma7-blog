# Tasks

## 1. GPX editing helpers

- [ ] 1.1 Expose the full-point reader from `lib/track-gpx-parser.ts` (or add `parseGpxEditablePoints`) returning every point with its ordinal `index`, `lat`, `lng`, `ele?`, `time?`, and the source element span.
- [ ] 1.2 Add `lib/track-gpx-edit.ts`: sampled view builder (`MAX_EDITOR_POINTS = 2000`, first/last included), speed derivation, removal-mask builder with `CLEANUP_POINT_RADIUS_METERS = 15` and `CLEANUP_TIME_WINDOW_SECONDS = 10`, range normalization, XML splice by span, and a minimum-two-points check.
- [ ] 1.3 Add `scripts/check-track-point-removal.ts` with a fixture GPX that asserts: selected ordinals disappear, `<ele>`/`<time>`/extensions survive, a click expands to nearby hidden points, a range removes exactly its indices, and an invalid result is rejected.

## 2. Data layer

- [ ] 2.1 Add an owner-scoped loader that returns the sampled editor payload: `fileAssetId`, total point count, sampled points with speeds, bounds, and `hasTimeline`; reject route-based, foreign, or non-`TRACK_GPX` tracks.
- [ ] 2.2 Extend `getPublicTrackBySlug` with an optional viewer id and compute `canCleanPoints` without exposing a user id or the full file.
- [ ] 2.3 Add the `cleanTrackPoints` action: owner check, `routeId` rejection, `track-upload` trust gate, file fetch, full parse, mask build, minimum-two-points check, XML splice, `validateGpxString`, upload.
- [ ] 2.4 In one transaction create the new `FileAsset`, update `Track.fileAssetId` with metadata parsed from the same bytes, and retire the previous asset `PENDING_DELETE`; reject when `fileAssetId` changed since load.
- [ ] 2.5 Revalidate the track surfaces and the public detail path through `lib/track-revalidation.ts`.

## 3. Cleanup modal

- [ ] 3.1 Add `components/track-pages/track-point-cleanup-dialog.tsx`: dialog shell at `sm:max-w-5xl` with internal scroll, loading/error/empty states, selection footer with the selected count, and Save.
- [ ] 3.2 Add a read-only cleanup map that draws the sampled polyline and selectable markers; clicking a marker selects its full-index range.
- [ ] 3.3 Add a Recharts speed chart with `Brush` range selection and point click; disable it with an explanatory note when `hasTimeline` is false.
- [ ] 3.4 Normalize overlapping/adjacent ranges, keep map and chart selection in sync, and publish the chart values through a visually hidden table.
- [ ] 3.5 Wire Save to `cleanTrackPoints`, close on success, refresh the page, and surface validation/concurrency/failure messages without losing the selection.

## 4. Entry point and copy

- [ ] 4.1 On `app/(public)/tracks/[slug]/page.tsx`, read `authSession()`, pass the viewer id to `getPublicTrackBySlug`, and render the owner-only **Clean up points** button next to the file/download section.
- [ ] 4.2 Add `trips` namespace keys for the action, dialog title/description, map/chart headings, selection summary, no-timestamp note, minimum-points/concurrency/failure errors, and disabled states in EN and RU.

## 5. Validation

- [ ] 5.1 `npx tsx scripts/check-track-point-removal.ts` — expect all assertions to pass.
- [ ] 5.2 `npm run tsc` — expect no type errors.
- [ ] 5.3 `npx eslint app/\(public\)/tracks components/track-pages lib/track-gpx-edit.ts lib/track-gpx-parser.ts app/_data scripts/check-track-point-removal.ts --quiet` — expect no errors.
- [ ] 5.4 `npm run lint` — expect no new errors.
- [ ] 5.5 `npx tsx scripts/check-locale-placeholders.ts` — expect the new copy to pass.
- [ ] 5.6 `npx openspec validate feature-138-outdoor-track-point-deletion --strict` — expect the change to validate.
- [ ] 5.7 `npm run build` — run locally by the owner.

## 6. Browser check (the owner's)

- [ ] 6.1 Open an owned GPX track: the Clean up points action is visible; open it and confirm the map, speed chart, and selection count render.
- [ ] 6.2 Select one point, save, and confirm distance, point count, map line, and speed chart reflect the removal; confirm the old file is no longer downloaded.
- [ ] 6.3 Select a range on the chart, save, and confirm only points inside the range are removed and the order is preserved.
- [ ] 6.4 Confirm a track without timestamps opens with the speed-chart note and still allows map selection.
- [ ] 6.5 Confirm a route-based track and a track owned by someone else show no action, and a direct save is rejected.
- [ ] 6.6 Select nearly all points and confirm the minimum-two-points rejection leaves the track unchanged.
- [ ] 6.7 Confirm the Russian copy, the modal on a narrow viewport, and the error states read naturally.
