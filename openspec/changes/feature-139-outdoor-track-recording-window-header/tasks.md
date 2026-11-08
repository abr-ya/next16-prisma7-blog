# Tasks

## 1. Header recording line

- [ ] 1.1 Add a small pure helper that composes the recording line from optional start, optional finish, and optional duration, returning the explicit-unknown text for each partial branch described in `design.md`; verify every branch by inspecting the rendered strings for GPX both/one/none and MANUAL both/one/none.
- [ ] 1.2 Render the recording line in the `/tracks/[slug]` badge row with a `Clock` icon, a visible `Recording` label, `ml-auto` placement on wide screens, and wrapping below the badges on narrow screens; verify the header still renders all existing badges.
- [ ] 1.3 Resolve GPX values from `parsed.summary.time.start` / `.end` and format them with `formatTrackRecordingDateTime` in the track's recording timezone; verify a parsed GPX track shows start and finish and does not read the mirrored columns.
- [ ] 1.4 Resolve MANUAL values from `recordingStartAt` and `recordingDurationSeconds`, format the duration with the shared `formatTrackDuration` helper, and never derive a finish; verify a manual track with both values shows start plus duration only.
- [ ] 1.5 Add a doc comment above `formatTrackDuration` in `lib/track-gpx-metadata.ts` marking it as the single source of truth for track duration formatting across the header, GPX summary, lists, admin tables, trip cards, and workouts; verify the helper is the only duration formatter used by the changed page.
- [ ] 1.6 Render `Recording time not recorded` when the track has no usable recording values; verify a track without parsed times or manual metadata does not fail the page.

## 2. Remove duplicated lower values

- [ ] 2.1 Remove the `Recording start` and `Recording finish` cells from the GPX summary while keeping distance, points, elevation, duration, recording timezone, and timezone evidence; verify the summary no longer repeats the header values.
- [ ] 2.2 Remove the manual `Recording details` section entirely, since its start and duration moved to the header; verify no empty bordered section remains for manual tracks.

## 3. Validation

- [ ] 3.1 Run `npm run tsc` and confirm it passes.
- [ ] 3.2 Run targeted ESLint on `app/(public)/tracks/[slug]/page.tsx` and any changed helper file, and confirm it passes.
- [ ] 3.3 Browser-check the public detail page for a GPX track with parsed times, a manual track with start and duration, a manual track with start only, a manual track with duration only, and a track with no recording data; also check the header wrapping at a narrow viewport.
- [ ] 3.4 Ask the owner to run `npm run build` locally and confirm it passes.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec and archive the change after review.
- Move `feature-139-outdoor-track-recording-window-header` from the backlog roadmap row to the feature history on archive.
