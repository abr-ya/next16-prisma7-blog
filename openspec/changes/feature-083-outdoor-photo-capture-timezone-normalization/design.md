## Context

Timezone-less EXIF camera times are wall-clock evidence, not UTC instants. Current matching consumes an ISO value even when its timezone evidence is missing, which risks process-timezone-dependent coordinates. This change separates original wall-clock evidence, assumed timezone, and derived instant.

## Goals / Non-Goals

**Goals:**

- Safely derive matching time from exactly one confirmed track timezone when available.
- Allow owner/admin correction using IANA zones with historical timezone rules.
- Preserve existing data and make provenance visible during review.

**Non-Goals:**

- Geographic timezone lookup, fixed offsets, automatic historical bulk conversion, or silent reapproval of inferred coordinates.

## Decisions

### Store provenance separately from EXIF wall-clock evidence

Persist an additive capture-time normalization record containing the selected IANA timezone, provenance (`TRACK_DEFAULT` or `USER_CONFIRMED`), and derived UTC instant. Raw EXIF and its original wall-clock value remain immutable.

### Use the track default only when unambiguous

Resolve distinct confirmed IANA recording timezones across linked published tracks. Exactly one permits a provisional match; zero or more than one requires explicit owner/admin confirmation. This avoids silently selecting a route timezone by order.

### Require re-review rather than rewrite approved coordinates

Changing a timezone invalidates the timing premise of an existing inferred coordinate. Preserve that record and mark/review it through the existing coordinate workflow instead of overwriting it automatically.

## Risks / Trade-offs

- [A track timezone can be wrong] → label default assumptions and allow correction before approval.
- [Historical timezone conversion is difficult] → use IANA timezone rules at the photo date, never a fixed offset.
- [Existing photos have ambiguous ISO values] → do not bulk-convert; surface them for deliberate confirmation.

## Migration Plan

Add only forward metadata/schema support as needed. New and refreshed photos use the safe path; historical photos remain unchanged until explicitly reviewed.
