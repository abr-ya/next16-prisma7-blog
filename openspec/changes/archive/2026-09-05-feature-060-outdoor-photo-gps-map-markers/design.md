## Context

See `proposal.md` for motivation. Feature-059 already renders combined linked track geometry on `/hikes/[slug]`. Feature-057 added guest-safe thumbnails and authenticated full-photo access. Outdoor photos already store EXIF GPS in `Photo.metadata.summary.gps` (`{ lat, lng }`) when extraction succeeds. Public hike photo reads currently omit `metadata` to avoid leaking EXIF; this slice must derive a narrow marker view model server-side.

## Goals / Non-Goals

**Goals:**

- Render direct-GPS photo markers on the existing hike Leaflet map.
- Pass only visibility-safe marker fields to the client (id, title, lat, lng, optional thumbnail URL).
- Fit map bounds to tracks and markers together; allow marker-only maps.
- Keep tooltip content limited to title + optional thumbnail.

**Non-Goals:**

- No new Prisma model for map coordinates in this slice.
- No inferred/manual coordinates, day filters, or notes.
- No reparsing images or exposing full EXIF JSON publicly.

## Decisions

### Read direct GPS from existing EXIF summary, do not add a map-coordinate table yet

Use successful `Photo.metadata` GPS summary as the accepted public marker source for this slice. Server helpers should validate lat/lng with the existing `isValidGps` helper and ignore missing/failed/stale extractions.

Alternative considered: introduce `PhotoMapCoordinate` now. That is the right long-term provenance model for inferred/manual sources, but it adds schema and migration before the first marker UX is proven. Track that as later work already outlined in outdoor-photos specs (`outdoor-photo-track-time-inferred-coordinates` and related candidates).

### Build a narrow public marker DTO instead of shipping photo metadata

Public hike reads should select whatever server-side fields are needed to derive markers, then map to `{ photoId, title, lat, lng, thumbnailUrl | null }`. Do not send `metadata`, raw EXIF, camera fields, extraction errors, or provider URLs to the client.

Thumbnail URLs should reuse `/files/[fileId]/thumbnail` for the first eligible active image asset, matching gallery behavior.

### Extend the existing Leaflet hike/track map composition

Pass photo markers into the current `CombinedTrackMap` / `TrackMapLeaflet` path (or a thin hike-map wrapper) rather than adding a second map instance. Markers should use Leaflet `Marker`/`CircleMarker` plus `Tooltip`. Distinct photo marker styling should remain visually separate from track start/end icons.

Alternative considered: a second map for photos only. That breaks the layered hike-map concept from feature-058.

### Show the map when either tracks or GPS photos exist

Update the page condition that currently mounts the map only when mapped tracks exist so GPS-only hikes still get a map. If neither tracks nor markers exist, omit the map entirely.

### Defer marker → gallery deep-link

Opening the signed-in gallery from a marker click is useful but not required. Auth-safe behavior would need care for guests. Keep it out of this slice unless implementation is trivial after markers land; otherwise backlog later.

## Deferred Simplifications (tracked in backlog)

| Simplification in feature-060 | Why simplified now | Backlog follow-up |
| --- | --- | --- |
| Use EXIF GPS summary directly without a dedicated public map-coordinate entity | Prove marker UX and bounds/tooltips first; provenance model is needed mainly for inferred/manual sources | `feature-061-outdoor-photo-track-time-matching-spike`, then `outdoor-photo-track-time-inferred-coordinates` |
| No track-time suggestions for photos without EXIF GPS | Matching needs a dedicated spike (admin modal → log only) before persistence | **Ready:** `feature-061-outdoor-photo-track-time-matching-spike` |
| No marker click → gallery open | Keep auth/guest behavior simple; feature-057 already owns viewing | Optional later candidate if useful after markers ship |

## Risks / Trade-offs

- EXIF GPS can be inaccurate or indoors -> Mitigation: still useful as “camera said here”; inferred/manual correction comes later.
- Shipping full metadata would leak EXIF -> Mitigation: narrow DTO only.
- Marker-only maps need sensible zoom -> Mitigation: fitBounds for multiple markers; single-marker zoom fallback similar to single-point tracks.
- Stale EXIF after image replace -> Mitigation: ignore non-SUCCESS metadata; admins already have refresh controls.

## Migration Plan

1. Extend public hike read model to derive GPS markers.
2. Extend hike map UI for markers + tooltips + combined bounds.
3. Update hike page mount conditions for marker-only maps.
4. Validate with tsc/lint/OpenSpec/build and manual browser checks.

Rollback: revert map marker wiring; EXIF metadata and gallery behavior remain unchanged.
