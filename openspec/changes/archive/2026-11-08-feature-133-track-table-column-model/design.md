# Design

## Context

`createTracksAdminColumns` already separates the row-action state machine from column composition. The full tables render, in order: Kind, Type, Title, GPX file, GPX summary, Timezone, Trips, Updated, actions. The GPX summary cell (`tracks-admin-panel-parse-cell.tsx`) currently repeats the recording range and the manual start/duration. The workouts table uses a separate `createTrackWorkoutColumns` factory and stays out of scope.

The effective values already exist in `lib/track-effective-values.ts`: `getEffectiveTrackStart` and `getEffectiveTrackDurationSeconds` prefer the recording mirror and fall back to the parsed summary. `feature-129/131` use `getEffectiveTrackStart` as the sort accessor on the workouts table.

## Goals / Non-Goals

**Goals:**

- One column per information type on the full tables.
- Recording time and timezone read as one unit.
- Recording sorting agrees with the rendered start.
- No content-driven width regressions (the `fix-014` lesson).

**Non-Goals:**

- Changing `/my/workouts`, the public track page, or any mutation flow.
- Adding inline editing or new data.
- Localizing the admin table headers.

## Decisions

**Column order.** Classification, Title, GPX summary, Recording, Trips, Updated, actions. Classification replaces Kind and Type; Recording replaces the old Timezone slot and moves next to the GPX summary; the standalone GPX file column is removed.

**GPX file moves into the actions column.** The download target comes from `resolveTrackGeometry(track)?.fileAsset`, so an own file and a linked route's file both work. The actions cell gains a small stacked block: a `Download` icon link to `/files/<id>/download` with the file name as its title, and the formatted size beneath it. A row without geometry renders a disabled icon and no size. The title cell absorbs the draft/published status badge that used to live in the GPX file column.

**Classification cell.** A `flex flex-wrap gap-1` with the existing kind badge and activity-type badge. The kind keeps its `Workout` / `Route` wording; the type keeps the activity name or `Unclassified`. The cell is capped (`max-w-48`) so a long type name cannot stretch the table.

**Recording cell.** Two compact lines plus the timezone badge:
- start from `getEffectiveTrackStart`;
- finish from a new `getEffectiveTrackFinish`, which returns the parsed summary end when present, otherwise derives `start + duration` for MANUAL tracks, otherwise `null`;
- the badge uses `formatTrackRecordingTimezone` and truncates inside a fixed-width container.

Dates use `formatTrackRecordingDateTime(value, track.recordingTimezone)` so they match the Start/Finish formatting the workouts table and public page already use. Missing values render `—`.

**Recording sorting.** `accessorFn: (row) => getEffectiveTrackStart(row)`, `sortingFn: "datetime"`, `sortUndefined: "last"`, with `meta.sortLabel: "Recording"` and a `SortableHeader` header. This is exactly the `feature-129` contract: the accessor returns the value the cell renders, so the glyph and order cannot disagree.

**GPX summary cleanup.** Remove `recordingTime`, `manualStart`, and `manualDuration` from `TrackParseStatus`. Keep the parse badge, timezone-evidence badge, timeline badge, distance, and point count. The timezone-evidence badge stays because it describes the timestamp evidence rather than the recording timezone.

**Fixed widths over content-driven growth.** The new cells use fixed widths: `w-24` for Classification (badges truncate), `w-40` for Title (with truncation), `w-52` for GPX summary, and `w-44` for Recording and `w-28` for Updated, so sorting different rows cannot resize the table. This follows the `fix-014` fix.

**No new server data.** Both start and duration already come from `TrackListItem` plus the parsed metadata. The finish helper stays client-safe in `lib/track-effective-values.ts`, joining the existing start/distance/duration helpers.

## Risks / Trade-offs

- A derived MANUAL finish can differ from a later parsed GPX finish; the helper prefers the parsed end first, so a re-parsed row corrects itself.
- Long IANA timezone names can make the Recording cell wide; the badge truncates inside the fixed width and keeps the full name in a `title` attribute.
- Removing the standalone Timezone column reduces at-a-glance timezone scanning, but the badge stays in the Recording cell where it explains the times.
- Sort accessor and cell must read the same helper; the design pins both to `getEffectiveTrackStart` and the new finish helper is display-only.
