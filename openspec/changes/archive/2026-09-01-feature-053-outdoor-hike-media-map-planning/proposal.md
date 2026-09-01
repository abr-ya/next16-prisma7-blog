## Why

Public outdoor discovery should center on a hike page that tells the trip story with its linked tracks, linked photos, and map context, rather than exposing a standalone public photo gallery of unrelated uploads.

The project already has separate foundations for hikes, tracks, parsed GPX maps, photos, and photo EXIF/GPS extraction. This change plans the next outdoor slice sequence so future implementation can connect those pieces deliberately and preserve visibility boundaries.

## What Changes

- Define the target public experience for hike detail pages: published hike content with linked published tracks, linked published photos, and one combined map surface when map-ready data exists.
- Define admin and public-owner association workflows for attaching and detaching tracks and photos to hikes.
- Define hike participant membership so the hike creator can invite/add other users as trip participants.
- Define authenticated public hike-page uploads: hike creators can upload tracks and photos directly from the hike page, while participants can upload photos directly from the hike page but not tracks.
- Define how direct photo GPS coordinates and later time-based photo-to-track coordinate inference should fit into the roadmap.
- Reframe `outdoor-photos-public-gallery` as a later optional album/gallery concern, not the next public milestone.
- Split the larger direction into implementation slices that can be promoted after this planning change.

Non-goals:

- No database schema, route, UI, or map behavior is implemented by this planning change.
- No automatic coordinate interpolation is implemented in this change.
- No standalone public `/photos` gallery is introduced by this change.
- No bulk migration or cleanup of existing outdoor records is performed by this change.

## Capabilities

### New Capabilities

- `outdoor-hike-media-map`: Defines hike-centered public outdoor media/map behavior, hike-track/photo associations, combined hike maps, and photo coordinate strategy.

### Modified Capabilities

- `outdoor-photos`: Clarifies that standalone public photo browsing is not the immediate public milestone and that public photo exposure should first happen through hike-linked photos.

## Impact

- Affected future routes: public `/hikes/[slug]`, admin hike edit/manage surfaces, admin track/photo relationship controls, and possibly existing public `/tracks/[slug]` cross-links.
- Affected future data models: `Hike`, `Track`, `Photo`, hike participants, association tables between hikes/tracks and hikes/photos, stored GPX time ranges, stored photo EXIF capture timestamps, direct GPS coordinates, and future inferred coordinates.
- Affected public surfaces: published hike detail pages, signed-in contributor controls on hike pages, visibility-safe map/photo rendering, and upload entry points scoped to a hike.
- Affected admin surfaces: attaching/detaching tracks and photos to hikes, managing hike participants, ordering or grouping hike photos, and reviewing coordinate source/confidence when inferred coordinates are added.
- No new runtime dependencies are expected for this planning change.
