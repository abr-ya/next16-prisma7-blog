# Tasks

## 1. Display helpers

- [ ] 1.1 Add a `formatTrackTimeSource(value?: TrackTimeSource | null)` helper to `lib/track-gpx-metadata.ts` that returns the localized label for `GPX` / `MANUAL` / `NONE` and `null` for null/undefined; verify the function exists and is exported by reading the file after the edit.
- [ ] 1.2 Re-export `TrackTimeSource` from `lib/track-gpx-metadata.ts` (or confirm it is already importable from `@/generated/prisma`) so the four rendering surfaces can narrow the enum without a direct Prisma import.

## 2. Localization

- [ ] 2.1 Add a `trackTimeSourceGpx` key to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json` with the localized `GPX` badge label; verify both files parse by reading them back.
- [ ] 2.2 Confirm `placeOnMapTimeSourceManual` and `placeOnMapTimeSourceNone` already exist in both locale files (already shipped by feature-112) and reuse them on the four surfaces; verify by reading the existing keys.

## 3. Read-side projection extensions

- [ ] 3.1 In `app/_data/tracks.ts`, extend `publicTrackInclude` and the `PublicTrack` type so the public track detail projection returns `recordingStartAt: Date | null`, `recordingDurationSeconds: number | null`, and `timeSource: TrackTimeSource | null` alongside the existing `recordingTimezone`; verify the type compiles with `npm run tsc`.
- [ ] 3.2 Extend the admin track list `select` and projection type with the same three fields; verify by reading the updated file and confirming the select now includes them.
- [ ] 3.3 Extend the trip linked-track card projection returned from the public trip-media data helper (the helper that powers `/trips/[slug]`) with the same three fields; verify by reading the updated file and confirming the field names are present in the select and the result type.

## 4. Public track detail rendering

- [ ] 4.1 In `app/(public)/tracks/[slug]/page.tsx`, render a `<Badge variant="secondary">{formatTrackTimeSource(timeSource)}</Badge>` next to the existing `Recording timezone` row when `timeSource` is non-null; verify by reading the updated file and confirming the badge is gated on `track.timeSource`.
- [ ] 4.2 In the same file, render a `Recording start` line that calls `formatTrackRecordingDateTime(track.recordingStartAt, track.recordingTimezone)` when `track.timeSource === "MANUAL"` and `track.recordingStartAt` is non-null; verify by reading the file.
- [ ] 4.3 In the same file, render a `Recording duration` line that calls `formatTrackDuration(track.recordingDurationSeconds)` when `track.timeSource === "MANUAL"` and `track.recordingDurationSeconds` is non-null; verify by reading the file.
- [ ] 4.4 Confirm the existing `track.parsed.summary.time` block is untouched for GPX tracks; verify by reading the surrounding markup and confirming no fields were renamed or removed.

## 5. Public track list rendering

- [ ] 5.1 In `app/(public)/tracks/page.tsx`, render the `timeSource` badge on each published track card when `timeSource` is non-null; verify by reading the updated file.
- [ ] 5.2 In the same file, render the conditional `Recording start` and `Recording duration` lines on the card following the same `MANUAL`-only rules as task 4; verify by reading the file.

## 6. Admin track list rendering

- [ ] 6.1 In `app/admin/tracks/page.tsx`, render the `timeSource` badge on each row when `timeSource` is non-null; verify by reading the updated file.
- [ ] 6.2 In the same file, render the conditional `Recording start` and `Recording duration` lines on the row following the same `MANUAL`-only rules as task 4; verify by reading the file.

## 7. Trip linked-track card rendering

- [ ] 7.1 In `components/hike-pages/hike-trip-media.tsx`, render the `timeSource` badge on each linked-track card next to the existing recording-timezone badge when `timeSource` is non-null; verify by reading the updated file.
- [ ] 7.2 In the same file, render the conditional `Recording start` and `Recording duration` lines on the card following the same `MANUAL`-only rules as task 4; verify by reading the file.
- [ ] 7.3 Confirm the existing `track.parsed.summary.time` block on the linked-track card is untouched for GPX tracks; verify by reading the surrounding markup.

## 8. Validation

- [ ] 8.1 Run `npm run tsc` and confirm zero TypeScript errors across the changed files.
- [ ] 8.2 Run `npx eslint app/(public)/tracks/[slug]/page.tsx app/(public)/tracks/page.tsx app/admin/tracks/page.tsx components/hike-pages/hike-trip-media.tsx app/_data/tracks.ts lib/track-gpx-metadata.ts --quiet` and confirm zero warnings.
- [ ] 8.3 Run `npm run build` and confirm `/tracks`, `/tracks/[slug]`, `/admin/tracks`, and `/trips/[slug]` still appear in the build output.
- [ ] 8.4 Manual browser smoke check on a development build:
  - Open `/tracks/[slug]` for a published GPX track and confirm the new `timeSource = GPX` badge renders and the existing parsed block is unchanged.
  - Open `/tracks/[slug]` for a published MANUAL track with both fields set and confirm the `MANUAL` badge plus the two new lines render with formatted values.
  - Open `/tracks/[slug]` for a published MANUAL track with `recordingStartAt = null` and confirm only the badge and the `Recording duration` line render.
  - Open `/tracks/[slug]` for a published track with `timeSource = NONE` and confirm only the badge renders.
  - Open `/tracks`, `/admin/tracks`, and `/trips/[slug]` for a trip with linked tracks and confirm the same conditional rules apply on those surfaces.

## 9. Backlog and documentation bookkeeping

- [ ] 9.1 In `openspec/backlog.md`, remove the `outdoor-track-creation-public-metadata-manual-qa` follow-up (or amend it) so the display-surface checks it explicitly defers are no longer referenced as deferred once this slice merges.
- [ ] 9.2 Append a `feature-113 | feature-113-outdoor-track-recording-metadata-display | outdoor/tracks | ...` row to the Completed Features table in `openspec/feature-history.md`, summarising the new `timeSource` badge on the four surfaces, the conditional MANUAL-only `Recording start` / `Recording duration` lines, and the read-side projection extensions.
- [ ] 9.3 Run `openspec validate feature-113-outdoor-track-recording-metadata-display --strict` and confirm the change is ready to archive.