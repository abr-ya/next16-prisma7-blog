## 1. Data Model And Metadata Contract

- [ ] 1.1 Add nullable `Photo.metadata` JSON storage in `prisma/schema.prisma`.
- [ ] 1.2 Create a Prisma migration for photo metadata without editing generated Prisma client files manually.
- [ ] 1.3 Add a typed `lib/photo-exif-metadata.ts` contract with versioned status, source image identities, normalized summary fields, GPS coordinates, stale detection, and safe failure helpers.

## 2. Extraction Pipeline

- [ ] 2.1 Investigate current installed image tooling against real uploaded image metadata and confirm whether GPS coordinates can be read without a new dependency.
- [ ] 2.2 Add a focused EXIF parser dependency only if existing tooling cannot reliably extract capture date, camera fields, dimensions, orientation, and GPS coordinates.
- [ ] 2.3 Implement server-side photo metadata extraction from the current ordered photo image file assets.
- [ ] 2.4 Normalize capture date, dimensions, orientation, camera/lens basics, and best-effort GPS latitude/longitude into the versioned metadata payload.
- [ ] 2.5 Store safe failed extraction metadata when image fetch, decode, or parsing fails.

## 3. Photo Actions

- [ ] 3.1 Add an authenticated admin action to refresh metadata for an existing photo.
- [ ] 3.2 Mark existing metadata stale when an update changes the photo image file identity or order.
- [ ] 3.3 Ensure create/update/delete paths preserve image file assets and do not expose private provider URLs in returned metadata or errors.

## 4. Admin UI

- [ ] 4.1 Update `/admin/photos` data loading and table columns to show metadata state.
- [ ] 4.2 Show useful extracted summary values in admin, including capture date, dimensions, camera label, and GPS presence when available.
- [ ] 4.3 Add an admin refresh control with pending, success, stale, and failed states.
- [ ] 4.4 Ensure the UI does not add public photo pages or public EXIF/GPS display.

## 5. Documentation And Backlog

- [ ] 5.1 Keep `openspec/backlog.md` updated for `feature-052-outdoor-photos-exif-gps-capture` while implementation is in progress.
- [ ] 5.2 Update any outdoor photo notes or checklists if implementation decisions materially affect later gallery, hike association, or map-marker slices.

## 6. Validation

- [ ] 6.1 Run Prisma validation/generation through the existing project flow after the schema change.
- [ ] 6.2 Run `npm run tsc`.
- [ ] 6.3 Run `npm run lint` plus targeted ESLint for changed files outside `app` when needed.
- [ ] 6.4 Ask the user to run `npm run build` locally and paste the result because this feature touches Prisma/user-facing admin behavior.
- [ ] 6.5 Manually verify `/admin/photos` with images that have EXIF+GPS, EXIF without GPS, no EXIF, and a parse failure or unavailable file case.
