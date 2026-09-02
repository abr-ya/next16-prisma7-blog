## 1. Data Model

- [ ] 1.1 Add a Prisma join model for hike-photo associations with composite uniqueness on hike and photo ids.
- [ ] 1.2 Add hike-specific ordering fields to the association model.
- [ ] 1.3 Create an additive migration for the join table without changing existing hike, photo, image file asset, or extracted metadata rows.
- [ ] 1.4 Regenerate the Prisma client through the existing project flow.

## 2. Server Data And Actions

- [ ] 2.1 Add admin-only helpers/actions to attach and detach photos from hikes with duplicate-association protection.
- [ ] 2.2 Add admin-only helpers/actions to reorder photos within a hike and normalize association positions.
- [ ] 2.3 Extend admin hike and photo read models to include associated photos/hikes with status and link-friendly fields.
- [ ] 2.4 Extend public hike read models to expose only linked published photos with visibility-safe public image fields.
- [ ] 2.5 Revalidate affected admin lists and public hike detail paths after attach, detach, reorder, or relevant photo publication changes.

## 3. Admin UI

- [ ] 3.1 Add hike-side controls or dialogs for admins to view, attach, detach, and order associated photos.
- [ ] 3.2 Add photo-side association visibility so admins can see which hikes a photo is linked to.
- [ ] 3.3 Ensure admin UI distinguishes draft and published associated records without hiding draft associations from admins.
- [ ] 3.4 Preserve existing photo create/edit/delete, image-selection, and metadata-refresh workflows.

## 4. Public UI

- [ ] 4.1 Render linked published photos on public hike detail pages in hike-specific order.
- [ ] 4.2 Ensure public linked photo rendering does not expose draft photos, private/inactive file assets, provider URLs, EXIF/GPS details, camera metadata, or extraction errors.
- [ ] 4.3 Keep public hike pages usable when no linked public photos exist.
- [ ] 4.4 Preserve the absence of standalone public `/photos` and `/photos/[slug]` routes.

## 5. Documentation And Validation

- [ ] 5.1 Update any relevant implementation notes, roadmap docs, or checklists that track outdoor photo/hike behavior.
- [ ] 5.2 Run `openspec validate feature-055-outdoor-hike-photo-association --strict`.
- [ ] 5.3 Run `npm run tsc`.
- [ ] 5.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 5.5 Ask the user to run `npm run build` locally and confirm the result before considering routing/database behavior complete.
- [ ] 5.6 Manually check admin association workflows and public `/hikes/[slug]` rendering in the browser.
