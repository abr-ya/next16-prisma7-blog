# Proposal

## Why

The administrator's **Manage photos** dialog currently renders the first image through its original provider URL, which can load unnecessarily large files for a small row preview. Administrators need the same compact, application-owned thumbnail delivery already used by the public trip gallery, without weakening public image access rules.

## What Changes

- Render the first image in attached and available rows of `/admin/hikes` **Manage photos** through the existing `/files/[fileId]/thumbnail` route instead of a direct file-provider URL.
- Allow that thumbnail route to serve active outdoor-photo image assets to an authenticated administrator for this administrative preview workflow, including draft or not-yet-trip-linked photos.
- Preserve guest thumbnail access exclusively for published trip-linked photo images and keep full-size image delivery, attachment actions, ordering, coordinate review, and photo data unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Admin trip-photo association management displays compact previews without exposing original provider URLs or altering the public photo boundary.
- `file-sharing-structure`: The app-owned thumbnail route has an administrator-authorized path for active outdoor-photo images while preserving its guest-safe published-trip boundary.

## Impact

- Affected route: `/admin/hikes` and the existing `/files/[fileId]/thumbnail` endpoint.
- Likely implementation areas: `components/admin-pages/hikes-admin-panel.tsx`, `app/_data/hikes.ts`, and `app/_data/files.ts`.
- No Prisma schema, migration, new dependency, public route, or photo-record data-model change.

## Non-goals

- This change does not create persistent thumbnail derivatives, change thumbnail dimensions or caching, or alter UploadThing storage.
- This change does not change public gallery, authenticated full-photo viewer, photo association, or authorization behavior outside the narrow administrator thumbnail path.
