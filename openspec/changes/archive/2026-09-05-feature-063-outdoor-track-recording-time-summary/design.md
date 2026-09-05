## Context

See `proposal.md` for motivation. Current GPX parsing stores `summary.time.start`, `summary.time.end`, and `durationSeconds` as ISO strings derived through `Date.parse(...)` / `toISOString()`. That is enough to show start and finish, but not enough to tell whether the original GPX timestamps carried `Z`/offset evidence or were timezone-free. Public and admin pages already read stored parsed metadata, so the slice can stay inside `Track.metadata`.

## Goals / Non-Goals

**Goals:**

- Show start/finish recording times on existing track summary surfaces.
- Preserve and display a small timezone evidence signal from raw GPX time strings.
- Keep track metadata backward-compatible with previously parsed tracks.
- Make ambiguity visible before photo-time matching becomes persistent.

**Non-Goals:**

- No manual timezone override UI yet.
- No EXIF photo time parser changes in this slice.
- No retained timestamped route timeline.
- No DB migration.

## Decisions

### Store timezone evidence in GPX metadata JSON

Extend the current `track-gpx-metadata/v1` JSON shape in a backward-compatible way, likely under `summary.time.timezoneEvidence` or a sibling object. The reader should accept old metadata where this field is absent and display a conservative fallback such as “timezone evidence unknown”.

Alternative considered: bump metadata version immediately. That would force stale-state handling for every existing parsed track; the feature is display/provenance-only and can be backward-compatible.

### Detect evidence from raw GPX timestamp strings before normalization

The parser should inspect each usable raw `<time>` value before converting it to ISO. Classify the parsed track time evidence as:

- `UTC_OR_OFFSET`: at least the timestamps used for the stored range include `Z` or an explicit numeric offset.
- `MISSING`: usable timestamps exist, but the relevant raw values omit timezone/offset evidence.
- `UNKNOWN`: older metadata or mixed/unclear parser state.

The exact enum names can follow local style; the UI should avoid pretending a timezone-free timestamp is proven local or UTC.

Alternative considered: infer timezone from route coordinates. That needs a timezone lookup dependency or dataset and is too much for this slice.

### Display stored instants plus evidence, not corrected local guesses

Start/finish date-times should be formatted consistently with existing track summaries. If evidence is `UTC_OR_OFFSET`, label it as backed by GPX UTC/offset. If evidence is missing/unknown, show the warning state near the time so timezone issues are visible during manual review.

Alternative considered: ask for a timezone during track upload and rewrite stored start/end immediately. That is likely valuable later, but this slice should first make the problem observable.

## Risks / Trade-offs

- Existing parsed tracks lack timezone evidence -> Display “unknown” until reparse, and keep start/finish visible from existing stored times when available.
- GPX files with mixed timestamp formats -> Prefer conservative ambiguous/unknown labeling over false confidence.
- Extra text could clutter cards -> Use compact labels/badges and omit unavailable values.
- Users may expect automatic correction -> Copy should frame this as evidence/checking, not a correction system.

## Migration Plan

No schema migration. Existing tracks keep working. Reparse can gradually populate timezone evidence for tracks whose raw GPX files are still available. Rollback removes display wiring and ignores the optional metadata field.
