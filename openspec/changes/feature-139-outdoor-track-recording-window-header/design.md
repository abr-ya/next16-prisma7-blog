# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-tracks/spec.md` for the required behavior.

The public detail page already receives everything the header needs through `PublicTrack`: `recordingStartAt`, `recordingDurationSeconds`, `recordingTimezone`, `timeSource`, and `parsed.summary.time`. The page currently renders parsed times inside the GPX summary section and a separate `Recording details` section for manual tracks. The read projections do not need to change.

## Goals / Non-Goals

**Goals:**

- One recording-time line in the page header, readable at a glance, with no new query.
- Consistent use of the existing formatters and the track's recording timezone.
- Remove the duplicated start/finish values from the lower sections.

**Non-Goals:**

- Changing any other track surface (list, admin, trip card, workout table).
- Deriving a manual finish on the public detail page.
- Changing the parse pipeline, metadata envelope, or database schema.

## Decisions

### 1. Resolve the header values by `timeSource`

- `timeSource === "MANUAL"`: use the stored `recordingStartAt` and `recordingDurationSeconds` verbatim. Do not compute a finish.
- Otherwise (GPX-sourced): use `parsed.summary.time.start` and `.end`. The parsed summary stays the source of truth for GPX rows, as the existing spec requires; the mirrored columns are not read on this surface.
- `timeSource === "NONE"` or missing values: render the explicit unknown state described below.

Alternative considered: reuse `getEffectiveTrackFinish` from `lib/track-effective-values.ts`. Rejected for this surface because it derives a manual finish, which the owner explicitly excluded, and because it is typed for `TrackListItem`, not `PublicTrack`.

### 2. Compose the line with the existing formatters

Use `formatTrackRecordingDateTime(value, recordingTimezone)` for each known date-time and `formatTrackDuration(seconds)` for manual duration. Do not use `formatTrackRecordingTimeRange`, because it returns `null` when either side is missing and the header must keep the known side.

Duration formatting stays in the existing shared `formatTrackDuration` helper in `lib/track-gpx-metadata.ts`, which GPX summaries, public lists, admin tables, trip cards, and the workout table already use. The page must not add local rounding or unit logic, so a future change to the helper updates every surface at once. Add a short doc comment above the helper marking it as the single source of truth for track duration formatting.

The line is built by a small pure helper (either local to the page or next to the formatters in `lib/track-gpx-metadata.ts`) so the partial-value branches stay testable:

| Source | Both values | One value | No values |
| --- | --- | --- | --- |
| GPX | `<start> – <finish>` | `<start> – finish unknown` or `start unknown – <finish>` | `Recording time not recorded` |
| MANUAL | `<start> · <duration>` | `<start> · duration unknown` or `start unknown · <duration>` | `Recording time not recorded` |

The rendered line is prefixed with a visible `Recording` label and a `Clock` icon from `lucide-react`.

### 3. Header layout

Add the line to the existing `flex flex-wrap gap-2` badge row. On wide screens it sits at the end of the row (`ml-auto`); on narrow screens it wraps beneath the badges instead of shrinking them. The line uses `text-sm text-muted-foreground` and does not change badge sizing.

### 4. Remove the duplicated lower values

- GPX summary: drop the `Recording start` and `Recording finish` cells. Keep `Duration`, `Recording timezone`, and `Timezone evidence`.
- Manual `Recording details` section: remove the whole section. Its only two values now live in the header, so an empty bordered block would be worse than no block.

## Risks / Trade-offs

- [The header line appears for tracks with no recording data, including route-based tracks] → The line states `Recording time not recorded`, matching the explicit-unknown requirement; the owner can hide it later if it proves noisy.
- [Public detail and the full track tables now differ for manual tracks, because the tables derive a finish and the detail does not] → Intentional: the owner asked for stored values only on the public page; the table behavior is unchanged and out of scope.
- [GPX rows whose parse is stale show unknown even if mirrored columns still hold values] → Acceptable; parsed metadata is the declared source of truth for GPX tracks, and showing stale mirror values would contradict it.

## Migration Plan

None. No schema, data, or dependency changes; the change is a single page-rendering edit plus its spec update. Rollback is reverting the page change.
