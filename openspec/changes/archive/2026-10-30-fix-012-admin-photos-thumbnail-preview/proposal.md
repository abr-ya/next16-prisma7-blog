# Proposal

## Why

The `/admin/photos` preview column downloads the **original** upload for every visible row: `components/admin-pages/photos-admin-panel.tsx` renders `<img src={preview.url} />` inside a 56×56px box, so each row pulls multi-MB provider bytes to paint 56 pixels. Administrators need the compact, application-owned thumbnail delivery that `/admin/hikes` already uses, without weakening any image access rule.

## What Changes

- Render the `/admin/photos` preview column through the existing `/files/[fileId]/thumbnail` route instead of the original provider URL.
- Share one eligibility rule between the thumbnail route and the admin preview, so a row whose first image the route cannot serve renders the existing `ImageIcon` placeholder instead of a broken image.
- Leave the photo edit dialog's full-size image grid, the thumbnail route's dimensions and caching, photo records, and public photo visibility unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: The admin photos list previews rows with compact app-owned thumbnails instead of the original uploads.

## Impact

- Affected surface: the `/admin/photos` admin page and the existing `/files/[fileId]/thumbnail` endpoint, whose contract does not change.
- Likely implementation areas: `components/admin-pages/photos-admin-panel.tsx`, `app/_data/files.ts`, `lib/file-thumbnail.ts` (new shared helper), `app/_data/hikes/queries.ts`.
- No Prisma schema, migration, new dependency, public route, or photo-record data-model change.

## Non-goals

- The photo edit dialog's image grid keeps rendering the original uploads; only the list's preview column changes.
- `THUMBNAIL_MAX_EDGE_PX` (640px) and the route's `Cache-Control` stay as they are — the route is shared with the track map markers and the trip surfaces.
- No persistent thumbnail derivatives, no UploadThing storage change, and no new admin permission.
- The `/admin/hikes` **Manage photos** preview keeps its current eligibility behavior; the gap where a pending-delete image renders a broken thumbnail there is tracked separately in the backlog.
