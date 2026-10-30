# Tasks

## 1. Shared thumbnail helper

- [x] 1.1 Add `lib/file-thumbnail.ts` with `isThumbnailEligibleFileAsset(fileAsset)` — the conjunction the thumbnail route enforces (`status === "ACTIVE"`, `mimeType` starts with `image/`, `purpose === "OUTDOOR_PHOTO_IMAGE"`) — and `getFileThumbnailUrl(fileAssetId)` returning `/files/${fileAssetId}/thumbnail`. Use a type-only import for the Prisma enums so the module stays client-safe.
- [x] 1.2 In `app/_data/files.ts`, rewrite `getFileAssetForThumbnail` to use `isThumbnailEligibleFileAsset` while preserving its current error codes exactly: a missing or inactive asset → `File not found` (404), any other rejection → `Access denied` (403). Leave the guest-safe published-hike-photo path and the administrator path as they are.
- [x] 1.3 Replace the hand-written thumbnail URL templates with `getFileThumbnailUrl` in `app/_data/hikes/queries.ts`, `app/_data/hikes/internal.ts`, and `app/(public)/hikes/[slug]/page.tsx` — the emitted string must stay byte-identical.

## 2. Admin photos preview

- [x] 2.1 In `components/admin-pages/photos-admin-panel.tsx`, change `getPhotoPreviewImage` to return the photo's first linked `FileAsset` only when `isThumbnailEligibleFileAsset` accepts it, and `null` otherwise.
- [x] 2.2 In the preview column cell, render `<img src={getFileThumbnailUrl(preview.id)} …>` for the eligible case and keep the existing `ImageIcon` fallback for the `null` case. Do not change the cell's layout, its `alt` text, or the `size-14` box.
- [x] 2.3 Confirm the preview no longer points at a provider URL: `grep -n "preview.url" components/admin-pages/photos-admin-panel.tsx` returns nothing, while the edit dialog's `image.fileAsset.url` uses (the form's image grid) stay as they are.

## 3. Validation

- [x] 3.1 `npm run tsc` — expect no type errors.
- [x] 3.2 `npx eslint lib/file-thumbnail.ts components/admin-pages/photos-admin-panel.tsx app/_data/files.ts app/_data/hikes/queries.ts app/_data/hikes/internal.ts "app/(public)/hikes/[slug]/page.tsx" --quiet` — expect no errors.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 `npx openspec validate fix-012-admin-photos-thumbnail-preview` — expect the change to validate.

## 4. Backlog bookkeeping

- [x] 4.1 In `openspec/backlog.md`, replace the `admin-photos-full-size-preview-loads` row in the `## Fixes` table with `| In Progress | fix-012-admin-photos-thumbnail-preview | outdoor/admin-photos | … |`, recording the swap, the placeholder decision for an ineligible first image, and the rejected alternatives. Done at propose time.
- [x] 4.2 Add a `## Fixes` row for the sibling gap this change deliberately leaves open: `/admin/hikes` **Manage photos** builds its thumbnail URL without checking eligibility, so a photo image marked pending delete renders a broken thumbnail there. Done on 2026-10-30, while implementing.
- [x] 4.3 Flip the `fix-012` row's status to `Done` once the implementation is complete, before the change is archived. Done on 2026-10-30.

## 5. Browser and build check (the owner's)

- [x] 5.1 Open `/admin/photos` and confirm each row's preview renders a compact thumbnail, and that the browser network tab shows `/files/{fileId}/thumbnail` requests instead of the provider's original image. Verified by the owner on 2026-10-30: the preview requests `/files/<fileId>/thumbnail` (a 640px-max-edge WebP) and no provider URL, and the `/admin/trips` **Manage photos** previews render as well.
- [x] 5.2 Confirm the photo edit dialog still shows its full-size images, and that editing and deleting a photo still work. Waived by the owner on 2026-10-30; the deferred browser cases are recorded in `outdoor-admin-thumbnail-access-manual-qa` in the backlog.
- [x] 5.3 The owner runs the production build (`npm run build`) and reports the result — the agent does not start the dev server or run the build. Verified by the owner on 2026-10-30: the production build passed.
