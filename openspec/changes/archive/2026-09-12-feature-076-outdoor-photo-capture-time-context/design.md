## Context

See `proposal.md` for motivation. Photo EXIF metadata already stores an ISO capture instant plus `UTC_OR_OFFSET` or `MISSING` timezone evidence. Track records now retain an administrator-confirmed IANA recording timezone. Current photo formatting uses `Intl.DateTimeFormat` without an explicit timezone, so its detail display is browser-local and unlabelled; candidate matching correctly uses ISO/epoch instants.

## Goals / Non-Goals

**Goals:**

- Make an authorized reviewer able to compare photo and track timestamps without inferring the viewer/browser timezone.
- Reuse existing persisted values and ensure candidate selection has no data or algorithm change.
- Keep capture evidence explicit so a timezone-free EXIF value is not treated as confirmed local time.

**Non-Goals:**

- No Prisma changes, EXIF reparse, historic-data rewrite, or automatic timezone correction.
- No expansion of photo metadata visibility for anonymous or unrelated signed-in viewers.

## Decisions

### Use a shared deterministic capture-time formatter

Format the stored ISO value explicitly as UTC for the canonical comparison, and retain a readable display clearly labelled as viewer-local only where it is useful. Map existing evidence values to short user-facing labels. This avoids a new metadata schema and makes the distinction visible even for legacy data.

Alternative: display only the browser-local value with a label. Rejected because it still requires the reviewer to manually convert it before comparing with a track's selected timezone.

### Render source-track ranges through the existing track timezone formatter

Coordinate-review candidates already carry source track timestamps and track identity. Add the persisted recording timezone to the review projection and render the range with the same formatter used by administration/public track pages, falling back explicitly to UTC for legacy tracks.

Alternative: show raw ISO strings for both sides only. Rejected because it is accurate but less useful when checking a route-local recording timeline.

### Keep candidate construction byte-for-byte independent of display context

The matcher continues receiving only stored ISO timestamps and geometry/timeline data. New labels are calculated after candidate construction, so they cannot change previous-day, inside-window, between-track, or endpoint placement outcomes.

## Risks / Trade-offs

- Viewer-local display can remain confusing if treated as source time → label it as viewer-local and put the canonical UTC value beside it.
- Existing `MISSING` evidence reflects an unresolved EXIF timezone → describe it as missing evidence, not a bad timestamp or confirmed timezone.
- Projection additions can leak details → preserve existing authorized detail/review boundaries and do not add values to public gallery data.

## Migration Plan

1. Ship presentation/projection changes without mutating photo or track records.
2. Verify the Sofia example: a displayed browser-local photo time is compared through its stored UTC instant against the `Europe/Sofia` track range.
3. Rollback only UI/projection code if necessary; stored data and matching behavior remain unchanged.
