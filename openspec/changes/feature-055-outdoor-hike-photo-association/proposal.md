## Why

Published hike detail pages should become the primary public surface for outdoor photos, so selected photo records need a durable way to belong to hikes without losing their independent admin lifecycle or image file assets.

This slice follows the completed hike-track association work by adding hike-photo associations first, before public contribution uploads, albums, or map marker rendering.

## What Changes

- Add an admin-managed association between existing hikes and existing outdoor photos.
- Store each hike-photo association independently from the photo record and its image file assets.
- Add per-hike photo ordering foundations so linked photos can render in a stable order and later manual ordering work has a place to build.
- Extend admin hike/photo read models and UI so admins can view, attach, detach, and distinguish draft/published associated records from both sides where useful.
- Extend public hike detail pages to render linked published photos with visibility-safe image data.
- Keep draft photos, private/inactive image assets, provider URLs, public photo detail routes, albums, upload-from-hike workflows, GPS map markers, and timestamp inference out of this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Adds durable hike-photo associations, admin management behavior, public hike-linked photo rendering, ordering foundations, and explicit visibility boundaries for associated photos.
- `outdoor-photos`: Updates outdoor photo behavior so published photos can become public only through published hike associations while preserving the no-standalone-gallery boundary.

## Impact

- Affected routes: `/admin/hikes`, `/admin/photos`, `/hikes/[slug]`.
- Affected data models: Prisma `Hike`, `Photo`, photo image/file asset relations, and a new additive hike-photo join model.
- Affected server code: hike/photo admin actions and read helpers, public hike read helpers, cache revalidation for affected admin lists and public hike detail paths.
- Affected UI: admin hike/photo management surfaces and public hike detail rendering.
- No new external dependencies are expected.
