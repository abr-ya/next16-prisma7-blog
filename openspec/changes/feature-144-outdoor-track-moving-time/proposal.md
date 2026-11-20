# Proposal

## Why

A GPX workout reports one elapsed duration, so a two-hour walk with a forty-minute lunch break reads as two hours of activity. Owners and viewers need the distinction: total time is how long the workout lasted, moving time is how long it was actually in motion. The data is already in the timed points; the parser simply never derives it.

## What Changes

- Compute `movingDurationSeconds` at parse time from the full timed point list. A stop is a window of at least 60 seconds whose net displacement is below 25 metres (roughly 1 km/h); stopped intervals are subtracted from the elapsed time.
- Store it as an optional field in `summary.time` of the existing metadata envelope. `TRACK_GPX_METADATA_VERSION` stays `track-gpx-metadata/v1`: older parses remain readable and simply have no moving value instead of losing their whole summary.
- Show both values where a workout's time is read: the public track page header shows total and moving time for a timed GPX track, and the workouts table gains a sortable **Moving** column. Manual and route-based workouts keep total time only.
- Offer the owner a **Recalculate moving time** action on `/tracks/[slug]` when a timed GPX parse predates this change: it reuses the existing owner-gated `parseTrackGpx`, shows progress, and refreshes the page. It is hidden from other viewers, from manual workouts, and from route-based workouts.
- No schema change and no migration.

## Non-goals

- A pace/splits chart; moving time will feed it later, but that is `outdoor-track-pace-splits-chart`.
- Changing the elapsed duration, the recording window, or the GPX summary block.
- Per-kilometre moving calculations or elevation-aware effort.
- Moving time on the public `/tracks` list card or on trip cards.
- Backfilling every existing parse automatically; the owner triggers the reparse where it matters.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: timed GPX workouts expose a moving duration, the workouts table and the public header show it, and the owner can recalculate it for an older parse.

## Impact

- `lib/track-gpx-parser.ts` — the moving-time derivation from the full timed points.
- `lib/track-gpx-metadata.ts` — the optional summary field and its read validation, with no version bump.
- `lib/track-effective-values.ts` — the moving-time reader the table uses.
- `app/(public)/tracks/[slug]/page.tsx` and a small client control — the header values and the recalculation action.
- `components/admin-pages/tracks-workout-columns.tsx` — the **Moving** column.
- `scripts/check-track-moving-time.ts` — the pure algorithm cases.
- No schema, migration, API, or dependency changes.
