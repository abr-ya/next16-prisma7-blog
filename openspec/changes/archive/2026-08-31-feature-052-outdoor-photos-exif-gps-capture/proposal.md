## Why

Outdoor photos should understand useful facts from their uploaded image files so admins do not have to enter capture details by hand and later gallery/map slices can build on durable metadata. This slice adds EXIF extraction, including best-effort GPS capture, while keeping coordinates admin-only until a future public decision explicitly exposes them.

## What Changes

- Add stored photo metadata for EXIF extraction results, including capture date, camera/lens basics, image dimensions, orientation, and a safe raw EXIF subset where available.
- Try to extract GPS coordinates from uploaded outdoor photo image files and store normalized latitude/longitude when present.
- Add an admin-triggered extraction or refresh path so existing photos can populate metadata and changed image selections can be refreshed.
- Show extraction state and useful extracted summary fields in the admin photo list/edit surface.
- Keep public photo gallery, public EXIF display, hike association, photo map markers, reverse geocoding, and automatic track matching out of this slice.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: Outdoor photos gain stored EXIF/GPS metadata extraction and admin visibility for extraction state.

## Impact

- Data model: add nullable metadata storage to `Photo`, likely mirroring the existing versioned JSON metadata pattern used by `Track`.
- Prisma: add a migration for `Photo.metadata`; regenerate Prisma client through the project flow.
- Server/data: add photo metadata parsing helpers and wire create/update or admin refresh actions without exposing provider URLs publicly.
- Admin UI: update `/admin/photos` to show metadata state and selected extracted fields.
- Public UI: no new public `/photos` routes and no public coordinate display in this feature.
- Dependencies: prefer existing installed image tooling where possible; add a focused EXIF parser only if GPS extraction cannot be implemented reliably with current dependencies.
