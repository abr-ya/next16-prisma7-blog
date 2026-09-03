## Why

Published hike pages should be able to show a lightweight visual photo preview to guests without giving anonymous visitors access to full-size photo assets. Signed-in users should get the richer large-photo viewing experience after thumbnail behavior and access boundaries are explicit.

The current hike photo section renders the original uploaded image file in a small CSS-framed card, so the UI looks like thumbnails but technically exposes the full image bytes.

## What Changes

- Add a hike photo gallery viewer for signed-in site users on published hike detail pages.
- Restrict large/full hike photo image access to authenticated site users while preserving admin access.
- Replace guest-visible hike photo card images with true technical thumbnails or a server-generated thumbnail-sized response before allowing guests to see image previews.
- Generate thumbnails on demand in this slice, with cache headers, instead of storing persistent thumbnail derivatives yet.
- Preserve guest access to published hike pages and non-sensitive photo titles/descriptions when allowed by the public hike read model.
- Make the UI distinguish guest preview cards from signed-in full photo viewing without adding standalone public `/photos` routes.
- Keep draft photos, photos linked only to draft hikes, inactive image files, provider URLs, EXIF/GPS metadata, and extraction errors hidden from public surfaces.
- Track persistent thumbnail storage as a deliberate follow-up once photo volume, gallery usage, or album workflows justify derivative lifecycle work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Changes public hike-linked photo behavior so guest-visible images must be true thumbnails, while full-size photo viewing is limited to authenticated users.
- `outdoor-photos`: Adds explicit public display boundaries between thumbnail-safe guest previews and authenticated full photo access.

## Impact

- Affected routes: `/hikes/[slug]`, `/files/[fileId]/download`, and any new app-owned thumbnail/full-photo routes introduced by the design.
- Affected data models: no persistent thumbnail derivative model in this slice; future derivative tracking remains a follow-up.
- Affected server code: public hike read helpers, file access checks, image thumbnail generation/serving, and cache headers.
- Affected UI: public hike photo cards and authenticated large-photo viewer.
- No standalone public photo listing/detail route is introduced.
