## 1. Data Model

- [x] 1.1 Add a Prisma join model for hike-track associations with composite uniqueness on hike and track ids.
- [x] 1.2 Create an additive migration for the join table without changing existing hike, track, file asset, or track metadata rows.
- [x] 1.3 Regenerate the Prisma client through the existing project flow.

## 2. Server Data And Actions

- [x] 2.1 Add admin-only helpers/actions to attach and detach tracks from hikes with duplicate-association protection.
- [x] 2.2 Extend admin hike and track read models to include associated tracks/hikes with status and link-friendly fields.
- [x] 2.3 Extend public hike read models to expose only linked published tracks with visibility-safe fields.
- [x] 2.4 Extend public track read models to expose only linked published hikes with visibility-safe fields.
- [x] 2.5 Revalidate affected admin lists and public hike/track detail paths after attach or detach actions.

## 3. Admin UI

- [x] 3.1 Add hike-side controls or dialogs for admins to view, attach, and detach associated tracks.
- [x] 3.2 Add track-side association visibility so admins can see which hikes a track is linked to.
- [x] 3.3 Ensure admin UI distinguishes draft and published associated records without hiding draft associations from admins.
- [x] 3.4 Preserve existing track create/edit/delete, parse, and file-selection workflows.

## 4. Public UI

- [x] 4.1 Render linked published tracks on public hike detail pages without exposing draft tracks or provider URLs.
- [x] 4.2 Render linked published hikes on public track detail pages without exposing draft hikes.
- [x] 4.3 Keep public pages usable when no linked public associations exist.
- [x] 4.4 Preserve existing public track map and GPX download visibility behavior.

## 5. Documentation And Validation

- [x] 5.1 Update any relevant implementation notes or checklists that track outdoor roadmap behavior.
- [x] 5.2 Run `openspec validate feature-054-outdoor-hike-track-association --strict`.
- [x] 5.3 Run `npm run tsc`.
- [x] 5.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [x] 5.5 Ask the user to run `npm run build` locally and confirm the result before considering routing/database behavior complete.
- [x] 5.6 Manually check admin association workflows and public `/hikes/[slug]` and `/tracks/[slug]` rendering in the browser.
