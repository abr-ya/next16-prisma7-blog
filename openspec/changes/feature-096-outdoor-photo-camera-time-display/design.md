# Design

## Context

See `proposal.md` for motivation. Current extraction reads `DateTimeOriginal` and `OffsetTime*`, derives an ISO UTC instant, but stores `localWallTime` only when the offset is absent. The versioned JSON metadata already records capture provenance and has a safe refresh workflow; feature-083 already provides owner/admin IANA-timezone confirmation for offset-free wall-clock time and uses a single linked-track timezone as a provisional matching assumption.

## Goals / Non-Goals

**Goals:**

- Retain source camera-local time plus its explicit offset without weakening UTC-based matching.
- Make capture-time provenance readable in the authorized detail view.
- Reuse the existing confirmation authority and track-timezone safety rules.

**Non-Goals:**

- Add a Prisma column or rewrite all historical metadata.
- Treat a numeric offset as an IANA timezone or a reliable geographic location.
- Change coordinate matching, approval, or public-map eligibility.

## Decisions

### 1. Extend versioned EXIF metadata additively

The capture-time provenance record will preserve the EXIF camera wall-clock string whenever it is the selected capture source and add an optional numeric offset field for offset-backed EXIF. The existing `instantUtc`, source, and timezone-evidence fields remain intact. Metadata normalization accepts old records without the new optional fields; new or refreshed extraction writes the richer shape.

Alternative: reconstruct the camera-local value only from stored UTC in the viewer. Rejected because an offset is not an IANA timezone and the old metadata may not retain which EXIF offset generated UTC.

### 2. Render camera time first, UTC second

The shared formatter will produce labelled source camera time, offset/IANA context, and stored UTC separately. Offset-backed EXIF uses the preserved source value and offset as the primary display. GPS UTC falls back to UTC as primary. Offset-free EXIF remains the primary wall-clock display marked unconfirmed, with existing normalized/track-proposal context distinguished from source evidence.

Alternative: use UTC as the sole display. Rejected because it hides the time the photographer recorded and makes common trip-photo review unnecessarily difficult.

### 3. Reuse owner/admin controls and distinguish legacy recovery

Only the photo owner and administrators will receive the existing timezone-confirmation controls and a refresh recommendation. A legacy recovery condition is explicit: an offset-backed source has a stored instant but no preserved camera-local value or offset. Refresh remains user-initiated, replaces metadata through the existing file-reading path, and never rewrites coordinates automatically.

Alternative: automatically reparse all historical images. Rejected because it expands storage/network work, may fail for unavailable originals, and changes metadata without owner/admin review.

## Risks / Trade-offs

- [Risk] Older metadata lacks source camera fields → Mitigation: accept it unchanged and offer owner/admin refresh only when recovery is meaningful.
- [Risk] Confusing an offset with an IANA timezone → Mitigation: label `+02:00` as EXIF offset; show an IANA zone only when existing track/default or explicit-confirmation evidence supports it.
- [Risk] Multi-image photos may contain differing timestamps → Mitigation: preserve existing selected capture-image semantics and provenance rather than merge conflicting source values.

## Migration Plan

1. Add compatible metadata fields and parsing/normalization logic without a database migration.
2. Render old and new metadata safely; only newly parsed or manually refreshed files gain camera time/offset recovery.
3. Roll back presentation and parser changes without modifying persisted photo, coordinate, or trip records.
