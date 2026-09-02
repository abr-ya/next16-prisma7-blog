## 1. Data Model

- [x] 1.1 Add a Prisma join model for hike-photo associations with composite uniqueness on hike and photo ids.
- [x] 1.2 Add hike-specific ordering fields to the association model.
- [x] 1.3 Create an additive migration for the join table without changing existing hike, photo, image file asset, or extracted metadata rows.
- [x] 1.4 Regenerate the Prisma client through the existing project flow.

## 2. Server Data And Actions

- [x] 2.1 Add admin-only helpers/actions to attach and detach photos from hikes with duplicate-association protection.
- [x] 2.2 Add admin-only helpers/actions to reorder photos within a hike and normalize association positions.
- [x] 2.3 Extend admin hike and photo read models to include associated photos/hikes with status and link-friendly fields.
- [x] 2.4 Extend public hike read models to expose only linked published photos with visibility-safe public image fields.
- [x] 2.5 Revalidate affected admin lists and public hike detail paths after attach, detach, reorder, or relevant photo publication changes.

## 3. Admin UI

- [x] 3.1 Add hike-side controls or dialogs for admins to view, attach, detach, and order associated photos.
- [x] 3.2 Add photo-side association visibility so admins can see which hikes a photo is linked to.
- [x] 3.3 Ensure admin UI distinguishes draft and published associated records without hiding draft associations from admins.
- [x] 3.4 Preserve existing photo create/edit/delete, image-selection, and metadata-refresh workflows.

## 4. Public UI

- [x] 4.1 Render linked published photos on public hike detail pages in hike-specific order.
- [x] 4.2 Ensure public linked photo rendering does not expose draft photos, private/inactive file assets, provider URLs, EXIF/GPS details, camera metadata, or extraction errors.
- [x] 4.3 Keep public hike pages usable when no linked public photos exist.
- [x] 4.4 Preserve the absence of standalone public `/photos` and `/photos/[slug]` routes.

## 5. Documentation And Validation

- [x] 5.1 Update any relevant implementation notes, roadmap docs, or checklists that track outdoor photo/hike behavior.
- [x] 5.2 Run `openspec validate feature-055-outdoor-hike-photo-association --strict`.
- [x] 5.3 Run `npm run tsc`.
- [x] 5.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [x] 5.5 Ask the user to run `npm run build` locally and confirm the result before considering routing/database behavior complete.
- [x] 5.6 Manually check admin association workflows and public `/hikes/[slug]` rendering in the browser.
