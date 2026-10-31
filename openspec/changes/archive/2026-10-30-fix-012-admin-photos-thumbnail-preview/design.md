# Design

## Context

`/admin/photos` renders one preview image per row. The row cell is a 56×56px box, but it points at `FileAsset.url` — the original upload — so every visible row downloads a multi-MB image to paint 56 pixels.

The application already owns a compact delivery path: `app/files/[fileId]/thumbnail/route.ts` fetches the provider file and returns a 640px-max-edge WebP (q72) with a 7-day `Cache-Control`. Feature-102 established the URL shape `/files/${fileAsset.id}/thumbnail` for `/admin/hikes`, and `getFileAssetForThumbnail` (`app/_data/files.ts`) already grants an authenticated administrator access to active outdoor-photo images. The admin access rule therefore needs no change — this is a swap, not new infrastructure.

## Decision: what a row renders when the first image cannot be served as a thumbnail

`getFileAssetForThumbnail` rejects any asset that is not `ACTIVE`, not `image/*`, or not `OUTDOOR_PHOTO_IMAGE`, and `photoListInclude` selects a photo's images regardless of status. A naive swap would therefore render a broken image for such rows.

Reachability: `DETACHED` and `DELETED` have no writers in `app/` or `lib/`; the only realistic non-`ACTIVE` state is `PENDING_DELETE`, which `markFileAssetPendingDelete` (`app/_actions/files.ts`) can set for any active file — including a photo image — from `/admin/files`, while the photo row stays visible in `/admin/photos`.

**Chosen: render the existing `ImageIcon` placeholder for a row whose first image cannot be served as a thumbnail.**

Rejected alternatives:

- *Fall back to the original provider URL for non-`ACTIVE` assets.* Keeps the multi-megabyte download for exactly the rows that are on their way out, and keeps the provider-URL exposure this change removes.
- *Select the first eligible image instead of `images.at(0)`.* Silently changes which image the preview represents, so the preview could disagree with the edit dialog's first image.

The placeholder is the list's existing non-image fallback, so no new visual element is introduced.

## Decision: one shared eligibility rule

The route and the preview must agree on which assets can be rendered as thumbnails; otherwise the preview can point at a URL the route refuses.

`lib/file-thumbnail.ts` (new, client-safe) exports:

- `isThumbnailEligibleFileAsset(fileAsset)` — the conjunction the route enforces: `status === "ACTIVE"`, `mimeType` starts with `image/`, `purpose === "OUTDOOR_PHOTO_IMAGE"`.
- `getFileThumbnailUrl(fileAssetId)` — the `/files/[fileId]/thumbnail` URL shape.

`getFileAssetForThumbnail` is rewritten to call the shared predicate while preserving its existing error codes exactly: a missing or inactive asset still reports `File not found` (404), and every other rejection still reports `Access denied` (403). The guest-safe published-hike-photo path and the administrator path are unchanged, so `file-sharing-structure` keeps its current requirement.

The helper lives in `lib/` rather than in `app/_data/files.ts` because `app/_data/photos.ts` is a `"use server"` module: the admin panel may import its server actions but not runtime values from it, so a client-safe module is required for the preview cell to decide eligibility.

## Decision: where the preview URL is built

The preview cell builds the URL itself from the `FileAsset` fields the list query already selects — `include: { fileAsset: true }` returns every scalar, including `status`, `mimeType`, and `purpose`. No new data-layer field, no change to the `PhotoListItem` type, and no change to `listPhotos`' return type are needed.

`app/_data/hikes/queries.ts`, `app/_data/hikes/internal.ts`, and `app/(public)/hikes/[slug]/page.tsx` switch their hand-written URL templates to the same `getFileThumbnailUrl` helper, so the URL shape has one source. The emitted string is identical in every case.

## Data model

No change. No Prisma schema edit, no migration, no new column, no seed change. `FileAsset` statuses and purposes are read as they are today.

## Server/client boundary

The admin panel stays a client component. It receives the photo rows from `listPhotos` exactly as today and derives the preview URL locally from data already in the payload. All data access and all authorization stay on the server: the thumbnail route re-checks the asset's status, MIME type, purpose, and the administrator's role on every request.

## Security and visibility

- No new route, no new permission, and no change to the route's access rules. The route already denies non-administrators for assets that are not published-hike-linked.
- The change removes a provider-URL fetch from the admin preview; it does not add one.
- The route's `Cache-Control: public, max-age=604800` is unchanged and stays shared with the track map markers and the trip surfaces. Changing it is out of scope here.
- Photo records, file assets, and public photo visibility are untouched.

## Data preservation

Nothing is written. The change only alters which URL a browser requests for the preview.

## Risk

Low. The route, its access rules, and the URL shape already exist and are exercised by `/admin/hikes`. The one behavior change beyond the swap is that a row whose first image is not an active outdoor-photo image now shows the placeholder instead of the original — a state reachable only through `/admin/files` marking that image pending delete.
