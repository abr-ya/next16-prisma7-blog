## Why

Outdoor hikes already have a minimal admin and public foundation, but there is still no way to store GPX track files as first-class content. This slice adds the first `Track` entity backed by a validated GPX `FileAsset`, plus admin create/edit/list workflows, so later public download, hike association, GPX parsing, and map rendering can build on real stored records instead of ad hoc file links.

## What Changes

- Add a first-class `Track` entity with title, slug, optional description, publication status, owner, required GPX `FileAsset` reference, nullable metadata shell, and timestamps.
- Add `FileAssetPurpose.TRACK_GPX` and a dedicated authenticated UploadThing route for GPX uploads with server-side validation.
- Add server-side track validation and data helpers/actions for admin listing, create, update, and delete.
- Add `/admin/tracks` with an admin list and create/edit controls that upload or replace the linked GPX file.
- Add a Tracks entry to the admin navigation.
- Keep the model ready for later hike association, GPX parsing, public pages, and map rendering without implementing those workflows now.

Non-goals:

- No public `/tracks` listing or detail pages.
- No public GPX download/preview behavior beyond what already exists for generic `FileAsset` records.
- No GPX geometry parsing, distance/bounds/elevation summaries, or stored parsed read models.
- No map rendering or tile integration.
- No hike-to-track association workflow.
- No tags, comments, search, localization, or rich filtering for tracks.

## Capabilities

### New Capabilities

- `outdoor-tracks`: Track storage, GPX file binding, admin management, and metadata-shell readiness before public/map/association slices.

### Modified Capabilities

- `file-sharing-structure`: Add a dedicated authenticated GPX track upload route that records `TRACK_GPX` file assets with validation and quota enforcement.

## Impact

- Data models: add `Track`, `TrackStatus`, and `FileAssetPurpose.TRACK_GPX` in Prisma with a migration.
- Upload routes: add a dedicated GPX track upload route in `app/api/uploadthing`.
- Routes: add `/admin/tracks` only; no new public routes in this slice.
- Data access: add track helpers/actions under the existing server-side data/action conventions.
- UI: add admin table/form components for tracks and GPX upload/replace controls.
- Navigation: add an admin sidebar item for tracks.
- Validation: require `npm run tsc`, `npm run lint`, and local build validation because this changes Prisma schema and upload routes.
