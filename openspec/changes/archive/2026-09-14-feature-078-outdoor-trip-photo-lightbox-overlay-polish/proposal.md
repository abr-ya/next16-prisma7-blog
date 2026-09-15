## Why

The authenticated trip-photo lightbox currently provides little orientation in a multi-photo set, and opening photo details expands the dialog enough to shift its geometry and introduce scrolling. Viewers should be able to see their position and inspect authorized details without disrupting the photo-viewing flow.

## What Changes

- Show the active photo's ordinal and the total number of linked photos in the authenticated trip-photo lightbox.
- Render the existing authorized photo-details content as a compact, semi-transparent overlay over the displayed photo instead of as dialog content below it.
- Keep the lightbox's dimensions stable when photo details are opened or closed, avoiding details-triggered scrolling.

### Non-goals

- Do not change which users can open full-size photos or view photo metadata.
- Do not alter photo ordering, map behavior, gallery cards, EXIF extraction, coordinate review, or file/download routes.
- Do not add map-marker-to-lightbox interaction; that is tracked separately as `outdoor-trip-map-photo-lightbox`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Define stable, position-aware authenticated lightbox behavior and its authorized details overlay.

## Impact

- Affected public surface: authenticated `/trips/[slug]` photo lightbox (with legacy hike-route compatibility preserved).
- Affected UI: `components/hike-pages/hike-photo-gallery.tsx` and its existing dialog/authorized-detail composition.
- No data model, migration, API, dependency, or authorization-policy change.
