# Proposal

## Why

The full track tables (`/my/tracks` and `/admin/tracks`) spread one piece of information across several columns and mix different kinds in one cell. **Kind** and **Type** sit next to each other as two badges, the recording timezone is a separate column far from the time it describes, and the recording start/finish lives inside the GPX summary cell, mixed with parse state, distance, and point count. That makes the table harder to scan and leaves the timezone visually detached from the recording time.

## What Changes

- Merge **Kind** and **Type** into one **Classification** column: a kind badge (`Route` / `Workout`) plus the activity-type badge.
- Add a **Recording** column that owns the recording time: effective start, derived finish, and the recording-timezone badge in the same cell.
- Remove the standalone **Timezone** column.
- Reduce the **GPX summary** cell to parsing state, distance, point count, and timeline (plus its existing timezone-evidence badge); it no longer duplicates the recording start/finish or manual start/duration.
- Make **Recording** sortable through the same effective-start accessor `feature-129`/`feature-131` use on `/my/workouts`, so the header glyph and the visible order agree.
- Size the new cells so the table does not become content-driven again (the `fix-014` lesson).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the full track-table column model changes; the workouts table keeps its short column set.

## Impact

- `components/admin-pages/tracks-admin-columns.tsx`: classification and recording columns, timezone removal, sort accessor.
- `components/admin-pages/tracks-admin-panel-parse-cell.tsx`: drop the recording/manual-time lines from the summary cell.
- `lib/track-effective-values.ts`: a `getEffectiveTrackFinish` helper alongside the existing start/distance/duration helpers.
- New `scripts/check-track-recording-finish.ts`.
- No Prisma schema change, no migration, no query, no route, and no change to `/my/workouts` or the public track page.

## Non-Goals

- Changing `/my/workouts`; its short column set, including its own timezone column, stays as it is.
- Adding or editing recording values from the table; the existing edit and timezone dialogs remain the mutation paths.
- Localizing the admin table headers; they stay English like the rest of that table.
- Changing the default sort (`updatedAt desc`) or the row actions.
