## Why

Feature-061 proved admins can propose track-time match candidates for hike-linked photos without direct EXIF GPS, but acceptance only logs. Those photos still never appear on the public hike map. We now need durable inferred coordinates with provenance, admin approval, and public markers—without pretending start/end-only track summaries can place a photo precisely along a route.

## What Changes

- Persist inferred photo map coordinates (with provenance, match context, confidence/quality, and review status) on photo metadata when an admin accepts a track-time candidate.
- Extend GPX parsing/metadata so tracks can retain a compact timestamped trackpoint timeline sufficient for along-route time interpolation when raw GPX times exist; keep existing simplified `mapGeometry` for drawing.
- Evolve the existing admin spike UI into an approve/reject (and optional manual lat/lng correction) workflow that writes durable state instead of console-only logs.
- Show approved inferred markers on the public `/hikes/[slug]` map for linked published photos that lack direct EXIF GPS, while direct EXIF GPS remains preferred when present.
- Keep rejected or unapproved inferred candidates off the public map without deleting the photo, images, or EXIF data.

Non-goals:

- No day filtering, notes layer, albums, or social reactions/comments.
- No automatic public placement without admin approval.
- No replacement of feature-060 direct EXIF GPS markers.
- No full freehand map pin editor beyond optional numeric lat/lng correction at approve time.
- No participant contribution uploads or hike-to-trip rename.
- No rewriting historical GPX files; older tracks gain timelines only after reparse when the source file is still available.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-photos`: Replace spike-only accept→log behavior with persisted inferred/manual coordinate review state and public-readiness rules.
- `outdoor-hike-media-map`: Allow public hike map markers from approved inferred (or manually corrected) coordinates when direct EXIF GPS is absent; keep spike-only wording out of the live requirement.
- `outdoor-tracks`: Require optional compact timestamped timeline retention in parsed track metadata for interpolation-quality inferred placement.

## Impact

- Affected surfaces: admin hike photo track-time matching UI; public `/hikes/[slug]` map markers; track GPX parse/refresh paths that populate metadata.
- Affected data: `Photo.metadata` gains a versioned inferred/manual map-coordinate review object; `Track.metadata` may gain optional timed points alongside existing summary/geometry (same JSON column, backward-compatible readers).
- Dependencies: reuse `lib/outdoor-photo-track-time-matching.ts`, photo EXIF `capturedAt`, track time evidence from feature-063, and existing hike photo marker plumbing from feature-060.
- Follow-ups: day filter (`outdoor-hike-map-day-filter`), richer manual map editing, and denser timeline policies if real GPX volume needs stricter caps.
- Validation: OpenSpec strict validation, `tsc`, lint, local build, and manual checks for inside-window interpolation, between-tracks midpoint, approve→public marker, reject→no marker, and direct-GPS precedence.
