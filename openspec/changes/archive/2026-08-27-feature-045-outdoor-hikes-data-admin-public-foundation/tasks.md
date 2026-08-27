## 1. Data Model

- [x] 1.1 Add `Hike`, `HikeStatus`, and `HikeType` to `prisma/schema.prisma` with indexes for slug, status, date range, and owner.
- [x] 1.2 Create a Prisma migration for the hike model without touching existing migrations or generated client files manually.
- [x] 1.3 Regenerate the Prisma client through the existing project flow.

## 2. Server Data Boundary

- [x] 2.1 Add server-side hike validation for required fields, slug format/uniqueness, and date range ordering.
- [x] 2.2 Add data helpers/actions for admin listing, create, update, delete, and public published-only reads.
- [x] 2.3 Ensure draft/missing public hike detail reads use not-found behavior and do not expose unpublished records.

## 3. Admin UI

- [x] 3.1 Add `/admin/hikes` with breadcrumbs, create action entry point, and a table of hikes.
- [x] 3.2 Add hike create/edit form controls for title, slug, description, start date, end date, type, and status.
- [x] 3.3 Add admin row actions for editing and deleting hikes with the existing confirmation pattern where appropriate.
- [x] 3.4 Add a Hikes entry to the admin sidebar navigation.

## 4. Public UI

- [x] 4.1 Add `/hikes` public listing with published hikes, empty state, date range, type, and summary text.
- [x] 4.2 Add `/hikes/[slug]` public detail page with published hike title, description, date range, and type.
- [x] 4.3 Add route metadata for the public hike listing/detail pages using the existing metadata helper.

## 5. Backlog and Validation

- [x] 5.1 Confirm the roadmap keeps later tracks/photos/maps/EXIF work as separate backlog candidates.
- [x] 5.2 Run `npm run tsc`.
- [x] 5.3 Run `npm run lint`.
- [x] 5.4 Ask the user to run `npm run build` locally and report the result because this slice changes Prisma schema and routes.
