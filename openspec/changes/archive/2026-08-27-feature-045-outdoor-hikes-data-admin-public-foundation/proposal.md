## Why

The site needs a first outdoor content surface where hikes can be stored, managed, and viewed before tracks, photos, maps, and EXIF automation are layered on top. This slice delivers a complete but small hike increment: database record, admin management, and minimal public pages.

## What Changes

- Add a first-class `Hike` entity with title, slug, description, start date, end date, type, publication status, owner, and timestamps.
- Add server-side data helpers/actions for listing, creating, updating, and deleting hikes.
- Add `/admin/hikes` with an admin list and create/edit controls following existing admin page patterns.
- Add minimal public `/hikes` and `/hikes/[slug]` pages that show published hikes only.
- Add a Hikes entry to the admin navigation.
- Keep the model ready for later track/photo associations without implementing those associations now.

Non-goals:

- No GPX track model, upload, parsing, or map rendering.
- No photo model, upload, EXIF extraction, galleries, albums, or sorting.
- No hike-to-track or hike-to-photo association workflow.
- No public comments, tags, search, localization, or rich filtering for hikes.

## Capabilities

### New Capabilities

- `outdoor-hikes`: Hike storage, admin management, and minimal public hike browsing/detail behavior.

### Modified Capabilities

- None.

## Impact

- Data models: add `Hike` and supporting enums/status fields in Prisma with a migration.
- Routes: add `/admin/hikes`, `/hikes`, and `/hikes/[slug]`.
- Data access: add hike helpers/actions under the existing server-side data/action conventions.
- UI: add admin table/form components and simple public hike list/detail components.
- Navigation: add an admin sidebar item for hikes.
- Validation: require `npm run tsc`, `npm run lint`, and local build validation because this changes routes and Prisma schema.
