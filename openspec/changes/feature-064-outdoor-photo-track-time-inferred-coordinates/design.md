## Context

See `proposal.md`. Feature-060 already places direct EXIF GPS markers. Feature-061 added an admin spike that proposes inside-window / between-tracks candidates and logs accepts. Feature-063 surfaces track recording times and timezone evidence. Track metadata still stores simplified `mapGeometry` without per-point times, so along-route lat/lng cannot be derived honestly until a compact timed timeline is retained. Photo EXIF already stores `summary.capturedAt` (now OffsetTime-aware when present) and optional `summary.gps`.

## Goals / Non-Goals

**Goals:**

- Durable photo map-coordinate review state with provenance and admin approve/reject.
- Compact timestamped track timeline in `Track.metadata` for interpolation when GPX times exist.
- Public hike map markers from approved inferred/manual coordinates when direct EXIF GPS is absent.
- Evolve the existing admin matching UI rather than inventing a second workflow.

**Non-Goals:**

- No day filter, notes, albums, or social features.
- No auto-publish of inferred markers without admin approval.
- No dense raw GPX dump in Postgres; timeline must stay capped/downsampled.
- No interactive map drag editor beyond optional numeric lat/lng correction.

## Decisions

### Store review state on `Photo.metadata`, not new tables

Extend the existing versioned photo metadata JSON with a sibling object such as `mapCoordinate` / `coordinateReview` that records:

- `lat` / `lng`
- `source`: `INFERRED_TRACK_TIME` | `MANUALLY_CORRECTED` (direct EXIF remains `summary.gps`, not this object)
- `status`: `PENDING_REVIEW` | `APPROVED` | `REJECTED` (or equivalent clear enum)
- provenance: candidate type, track id(s), matched time context, confidence/quality, explanation, reviewedAt/reviewedBy when useful

Rationale: matches current Photo/Track JSON patterns and avoids a migration until the shape stabilizes. Direct EXIF GPS stays the preferred public source and continues to live in EXIF summary.

Alternative considered: dedicated Prisma columns/table. Deferred until multi-hike coordinate conflicts or audit history demand it.

### Prefer direct EXIF GPS over inferred for public markers

Public marker selection order:

1. Valid direct EXIF `summary.gps` when extraction is SUCCESS
2. Else approved inferred/manual `mapCoordinate`
3. Else no marker

Rationale: camera GPS is stronger evidence than track-time inference. Inference UI stays available only when direct GPS is absent (same eligibility as the spike).

### Retain a compact timed timeline on tracks

On GPX parse/refresh, when enough `<trkpt>` values include usable times, store a downsampled `timeline` (or equivalent) of `{ time, lat, lng }` points under track metadata, keeping existing `mapGeometry` for polylines.

Use that timeline to interpolate lat/lng for **inside track window** accepts. For **between adjacent tracks**, continue using endpoint midpoint when endpoints are within the existing nearness threshold.

If a track has time start/end but no usable timed points after parse, do not invent along-route coordinates from start/end alone; the admin UI may still show an explanatory candidate, but persistence requires a resolvable lat/lng strategy (timeline interpolation or between-track midpoint / manual lat/lng).

Alternative considered: re-parse GPX on every approve. Rejected because public/admin pages should keep reading stored metadata, and re-fetching private GPX on each review is fragile.

### Evolve spike accept into durable approve/reject

Replace console-only accept with server actions that write photo metadata. Keep the modal candidate list. Add reject. Allow optional lat/lng override on approve → store as `MANUALLY_CORRECTED` while retaining match provenance notes when helpful.

### Confidence stays advisory; approval is the public gate

Surface timezone evidence / match quality in the modal so admins can decide, but do not auto-block persistence solely on `MISSING` timezone evidence in this slice. Public display still requires `APPROVED`.

Alternative considered: hard-require `UTC_OR_OFFSET` before approve. Useful later; for now explicit admin review is the safety rail after feature-063 made evidence visible.

## Risks / Trade-offs

- [Risk] Timeline JSON grows large for long GPX files → Mitigation: downsample/cap point count; document limit in code; prefer time-uniform sampling.
- [Risk] Ambiguous EXIF/track timezones misplace photos → Mitigation: show timezone evidence in review UI; require admin approve; OffsetTime-aware photo capture when present.
- [Risk] Old tracks lack timeline until reparse → Mitigation: readers treat missing timeline as unsupported for inside-window interpolation; admin can refresh track metadata when the GPX file remains available.
- [Risk] Approved inferred marker looks identical to EXIF GPS → Mitigation: public tooltip can stay title/thumbnail-only (privacy-safe); admin UI must show source/status. Optional public badge deferred unless needed.
- [Risk] Dual coordinate sources confuse precedence → Mitigation: encode explicit selection order in hike marker helper tests/comments and specs.

## Migration Plan

- No Prisma schema migration required if both payloads stay in existing `metadata` JSON columns.
- Deploy code with backward-compatible readers for tracks/photos missing timeline or mapCoordinate.
- Reparse tracks as needed to populate timelines; refresh/approve photo coordinates through admin UI.
- Rollback: ignore `mapCoordinate` and timeline fields; public map falls back to direct EXIF-only markers.

## Open Questions

- Exact downsample cap (e.g. max timed points per track) can be chosen during implementation as long as readers remain backward-compatible and public pages do not reparse GPX.
- Whether approved inferred markers need a subtle public visual distinction from EXIF markers can wait until first browser review.
