# Proposal

## Why

The public track detail page shows when a track was recorded only inside the lower GPX summary (or the separate `Recording details` block for manual tracks), so a reader has to scan past the map and badges to find the recording time. The owner confirmed on 2026-11-04 that the recording time belongs in the page header, and the current placement repeats the same facts in a second block.

## What Changes

- Add a compact recording-time line to the header of `/tracks/[slug]`, to the right of the existing badges.
- For GPX-sourced tracks, show the parsed recording start and finish (`parsed.summary.time.start` / `.end`) in the track's recording timezone.
- For `MANUAL` tracks, show only the stored values: `recordingStartAt` and `recordingDurationSeconds`. Do not derive a finish from start + duration on this surface.
- Format durations through the existing shared helper so the header, GPX summary, lists, admin tables, trip cards, and workouts stay identical; a future formatting change then applies everywhere at once.
- Render an explicit unknown for each missing value instead of an empty gap; when nothing is recorded, state that the recording time is not recorded.
- Remove the duplicated values from the lower blocks:
  - GPX summary keeps duration, recording timezone, and timezone evidence, and drops recording start/finish.
  - The separate `Recording details` block for manual tracks is removed, because both of its values move to the header.

## Non-goals

- No change to `/tracks` list cards, `/admin/tracks` rows, `/my/tracks`, `/my/workouts`, or the published-trip linked-track card.
- No derived manual finish on the public detail page; the full track tables keep their existing derived finish.
- No localization work on the public track page.
- No schema, server-action, parse, or read-projection changes.
- No change to how recording timezone or timezone evidence are stored or displayed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the public track detail page moves recording time into the header, manual tracks show their stored start and duration without a derived finish, and the lower blocks no longer duplicate those values.

## Impact

- `app/(public)/tracks/[slug]/page.tsx` — header line and removal of the duplicated lower fields.
- `lib/track-effective-values.ts` or a small formatting helper in `lib/track-gpx-metadata.ts` — shared start/finish/duration formatting for the header, if inline derivation is not enough.
- `openspec/specs/outdoor-tracks/spec.md` — two modified requirements.
- No database, API, dependency, or admin-surface changes.
