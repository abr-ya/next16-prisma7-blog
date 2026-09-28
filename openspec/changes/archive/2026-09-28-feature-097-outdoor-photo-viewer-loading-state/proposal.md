# Proposal

## Why

Authenticated visitors can open full-size trip photos, but the viewer changes the image source without showing that the next image is still loading. On slow connections, the previously selected photo can look like the new selection, which is misleading.

## What Changes

- Show a clear loading state while the first full-size image and every next/previous selection loads.
- Hide the previous image once a new selection begins, so it is never presented as the selected photo.
- Show an understandable in-viewer error state if the selected full-size image cannot load.
- Keep previous/next controls available while loading and retain existing details, comments, full-photo access, and visibility behavior.

### Non-goals

- Prefetching, caching, retries, image delivery changes, or new file endpoints.
- Changing the authenticated full-photo boundary, guest thumbnail behavior, photo ordering, or viewer layout.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Make authenticated large-photo viewer loading and failed-image states observable without changing photo access boundaries.

## Impact

- Affected public surface: authenticated `/trips/[slug]` photo viewer (including map-initiated opening).
- Affected code: `components/hike-pages/hike-photo-gallery.tsx` client-side image state and presentation.
- No database schema, route, API, dependency, or admin-surface changes.
