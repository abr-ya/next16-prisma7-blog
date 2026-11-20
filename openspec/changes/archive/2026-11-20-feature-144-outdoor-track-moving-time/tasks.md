# Tasks

## 1. Parser and metadata

- [x] 1.1 Add `MOVING_STOP_MIN_SECONDS = 60` and `MOVING_STOP_MAX_DISPLACEMENT_METERS = 25` and a pure moving-time helper in `lib/track-gpx-parser.ts`, fed by the full sorted timed points with coordinates.
- [x] 1.2 Use a two-pointer scan, merge overlapping stopped intervals, clamp the result to `0..elapsed`, and return `null` for fewer than two timed points.
- [x] 1.3 Add `movingDurationSeconds?: number | null` to `TrackGpxTimeSummary` and set it in `computeTime`; keep `TRACK_GPX_METADATA_VERSION` unchanged.
- [x] 1.4 Normalize the optional field in `readTrackGpxMetadata` so an older or malformed value reads as absent without failing the summary validation.

## 2. Display

- [x] 2.1 Add `getEffectiveTrackMovingDurationSeconds` to `lib/track-effective-values.ts` (parsed summary time only, `undefined` otherwise).
- [x] 2.2 Render total and moving time in the `/tracks/[slug]` header for a timed GPX workout, `Moving unavailable` when absent, and only the existing line for a manual or route-based workout.
- [x] 2.3 Add the sortable **Moving** column to `components/admin-pages/tracks-workout-columns.tsx` after **Duration**, with a dash when unavailable.

## 3. Recalculation

- [x] 3.1 Add a small client control that calls the existing owner-gated `parseTrackGpx`, disables while running, toasts the outcome, and refreshes the page.
- [x] 3.2 Show it only when `canRenameFile` is true, `timeSource` is `GPX`, a timed summary exists, and the moving value is absent.
- [x] 3.3 Confirm no new action, endpoint, permission, or payload field is added.

## 4. Verification

- [x] 4.1 Add `scripts/check-track-moving-time.ts` with the algorithm cases: continuous, one stationary minute, several stops, a trailing stop, jitter inside the radius, a sub-minute pause, no timed points, and the zero clamp.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run `npm run lint` and targeted `npx eslint` for the touched `lib`, `app`, and `components` files.
- [x] 4.4 Run `npx tsx scripts/check-track-moving-time.ts` and `npx openspec validate --changes --strict`.
- [x] 4.5 Run a production build in the sandbox, or ask the owner to run it locally when the sandbox network is restricted.
- [x] 4.6 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; verification creates no tracks.
