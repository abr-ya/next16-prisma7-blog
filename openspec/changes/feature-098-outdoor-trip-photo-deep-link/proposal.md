# Proposal

## Why

Visitors cannot currently share a stable link that opens a particular photo within a published trip. A photo deep link makes shared trip media directly addressable while retaining the existing access boundary for full-size images.

## What Changes

- Accept an optional `photo` query parameter on published `/trips/[slug]` pages and open the matching linked photo in the existing viewer.
- Validate the requested photo against the current trip's visible gallery items; invalid, unavailable, or cross-trip IDs leave the page and viewer in their normal state.
- Keep the URL synchronized with viewer navigation using a non-scrolling replacement, and remove the parameter when the viewer closes.
- Preserve guest behavior: a guest may arrive through a valid deep link but receives the existing sign-in guidance rather than a full-size image or protected URL.

### Non-goals

- Adding a share button, custom social-preview metadata per photo, new photo routes, or server/API endpoints.
- Changing photo visibility, membership, authentication, or full-image delivery rules.
- Supporting no-JavaScript viewer opening, map-popup URL changes, or comment anchors.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Let public trip URLs select a linked gallery photo while preserving existing visibility and full-photo access boundaries.

## Impact

- Affected public surface: `/trips/[slug]?photo={photoId}` and existing photo viewer navigation.
- Affected code: public trip page query handling, `HikeTripMedia`, and `HikePhotoGallery` client viewer coordination.
- No database schema, migrations, routes, file endpoints, dependencies, or admin surfaces change.
