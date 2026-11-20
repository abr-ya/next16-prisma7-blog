# Design

## Context

`parseTrackGpxMetadata` already derives `summary.time` from the points that carry a `<time>` element: start, end, elapsed `durationSeconds`, and the timezone evidence. It also builds a downsampled `timeline` for photo inference. Moving time needs the full timed points with their coordinates, which the parser has before it simplifies anything.

The metadata envelope is versioned (`track-gpx-metadata/v1`) and refusing an unknown shape would drop every existing summary, so this slice adds an optional field instead of a new version.

## Moving-Time Algorithm

Pure helper next to `computeTime` in `lib/track-gpx-parser.ts`, fed the full list of points that carry a usable timestamp, sorted by time:

- Elapsed time is the last timestamp minus the first.
- A window is a pair of timed points at least 60 seconds apart. When the great-circle distance between the window's first and last point is at most 25 metres (about 1 km/h average), the window counts as stopped.
- Windows are found with a two-pointer scan over the sorted points: for each start index, advance to the first point at least 60 seconds later. A qualifying window becomes a stopped interval `[t_start, t_end]`.
- Overlapping intervals are merged before summing, so a long stop is not counted twice.
- `movingDurationSeconds = clamp(round(elapsed − stopped), 0, round(elapsed))`.
- Fewer than two timed points yields `null`; a zero-length elapsed time yields `0`.

Constants `MOVING_STOP_MIN_SECONDS = 60` and `MOVING_STOP_MAX_DISPLACEMENT_METERS = 25` live next to the helper.

This is deliberately an approximation: a stop shorter than a minute, or the first and last partial minute of a longer stop, is not subtracted. It is stable, needs no new state, and is honest about what the data supports.

## Metadata

`TrackGpxTimeSummary` gains `movingDurationSeconds?: number | null`.

- The parser sets a number for a timed summary, or leaves it `null` when it cannot compute one.
- `isTimeSummary` keeps validating the fields it already required; the new field is optional and is not part of the shape gate.
- `readTrackGpxMetadata` normalizes the field: a finite number is kept, anything else is treated as absent. An older parse therefore reads as "no moving time" while its start, end, duration and evidence stay intact.
- No version bump and no migration. "Unavailable" is a normal state, not a parse failure.

## Display

- The public `/tracks/[slug]` header gains a second, muted value line for a timed GPX track: `Total 2 h · Moving 1 h 50 min`, using `formatTrackDuration`. When the moving value is absent, it reads `Moving unavailable` and the owner sees the recalculation action next to it. A manual or route-based track keeps only the existing start and duration line.
- The workouts table gains a sortable **Moving** column right after **Duration**, fed by a new `getEffectiveTrackMovingDurationSeconds` reader (parsed summary time, otherwise `undefined`), with a dash when unavailable.
- The public `/tracks` list card and trip cards are unchanged.
- Moving time is not yet used for pace; the pace/splits slice will consume the same field.

## Recalculating an Older Parse

The owner-gated `parseTrackGpx` action already re-parses a track's own file and preserves the `timeSource` classification; a GPX row stays GPX. The new client control calls it with the track id, disables itself while running, toasts the outcome, and calls `router.refresh()`.

Visibility on the public page is derived from what the payload already carries:

- `track.canRenameFile` is true only for the owner of a file-based track with an active own GPX, which excludes route-based workouts and every other viewer;
- `track.timeSource === "GPX"` excludes manual rows;
- `track.parsed?.summary.time` exists and `movingDurationSeconds` is absent means the parse predates this slice.

No new endpoint, action, or permission.

## Risks

- **Approximation.** Short stops and partial minutes are not subtracted; the value is described as moving time, not as an activity classifier.
- **Reparse side effects.** `parseTrackGpx` already overwrites the recording start and duration from the file on every reparse; this is existing behaviour, and the owner triggers it deliberately from a page that already shows those values.
- **Large files.** The scan is linear with a second pointer; no extra storage or payload beyond one number.
- **Old parses.** They show "unavailable" until the owner re-parses; no automatic backfill.
- **Manual tracks with a synthetic file.** They have a file and `canRenameFile`, but `timeSource` is `MANUAL`, so the action stays hidden.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-track-moving-time.ts`, `npx openspec validate --changes --strict`, and a production build. The script covers: a continuous track where moving equals elapsed, a single stationary minute, several stops, a stop that ends the track, jitter that never leaves the radius, a window shorter than 60 seconds, no timed points, and the clamp to zero. Browser checks stay deferred to a manual QA candidate and create no tracks: re-parse an existing GPX with a known pause, then read the header and the table.
