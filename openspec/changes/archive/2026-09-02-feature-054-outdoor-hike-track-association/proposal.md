## Why

Published hike pages should be able to tell the route part of a trip story by showing the tracks deliberately attached to that hike. The project already has hikes, GPX-backed tracks, public track pages, and stored map-ready track geometry, so the next safe slice is to add explicit admin-managed hike-track associations before building combined hike maps or public contribution uploads.

## What Changes

- Add a many-to-many hike-track association model so hikes and tracks can be linked without changing either record's identity.
- Let authenticated admins attach and detach existing tracks from existing hikes.
- Show linked tracks on admin hike and track management surfaces so admins can review relationships from either side.
- Show linked published tracks on public published hike detail pages, while excluding draft tracks and unsafe file/provider metadata.
- Show linked published hikes from public track detail pages when the current track belongs to published hikes.
- Preserve track records, GPX file assets, parsed metadata, and hike records when an association is removed.

Non-goals:

- No hike-photo association is added in this slice.
- No participant management or public hike-page uploads are added in this slice.
- No combined multi-track hike map is added in this slice; linked track maps remain available through existing track detail pages.
- No automatic matching between hikes and tracks is attempted.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Implements the first hike-media association slice for admin-managed hike-track links and public linked-track rendering.

## Impact

- Affected routes: `/admin/hikes`, `/admin/tracks`, public `/hikes/[slug]`, and public `/tracks/[slug]`.
- Affected data models: `Hike`, `Track`, and a new join table for hike-track associations.
- Affected server/data helpers: hike and track read models, admin association actions, public visibility-safe query helpers, and route revalidation for linked hike/track pages.
- Affected public surfaces: published hike detail pages and published track detail pages.
- Affected admin surfaces: hike and track management tables/forms or detail controls.
- Migration impact: add a non-destructive Prisma migration for the join table; preserve existing hike, track, `FileAsset`, and parsed GPX metadata records.
