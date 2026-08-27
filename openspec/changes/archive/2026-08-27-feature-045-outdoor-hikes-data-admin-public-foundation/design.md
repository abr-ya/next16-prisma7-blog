## Context

See proposal.md for motivation. The project already has Prisma-backed content domains, server-side data helpers in `app/_data`, admin pages under `app/admin`, admin page components under `components/admin-pages`, and public App Router pages under `app`. There is no outdoor content model yet.

## Goals / Non-Goals

**Goals:**

- Add the first durable hike model and route surfaces without depending on tracks or photos.
- Keep admin mutations authenticated and server-side.
- Keep public reads visibility-safe by exposing only published hikes.
- Follow existing admin table/form/page patterns rather than introducing a new admin architecture.

**Non-Goals:**

- No file uploads, maps, GPX parsing, EXIF handling, tags, comments, or search.
- No public navigation rollout unless implementation discovers the target route is already covered by an existing shared shell pattern.
- No many-to-many association tables yet; those belong to later track/photo slices.

## Decisions

1. Model hikes as a standalone Prisma `Hike` record.
   - Fields: `id`, `title`, `slug`, `description`, `startDate`, `endDate`, `type`, `status`, `userId`, `createdAt`, `updatedAt`.
   - Rationale: this gives later features a stable foreign-key target for tracks/photos without designing those models early.
   - Alternative considered: create hike, track, and photo models together. Rejected for this slice because it would make the first migration and UI too broad.

2. Use enum-style fields for hike type and status.
   - Proposed statuses: `DRAFT`, `PUBLISHED`.
   - Proposed types: `HIKING`, `MOUNTAIN`, `WATER`, `SKI`, `BIKE`, `OTHER`.
   - Rationale: the initial type vocabulary is small and can be displayed consistently in filters/lists later.
   - Alternative considered: free-text type. Rejected because it creates cleanup work before the domain is proven.

3. Keep public routes read-only and published-only.
   - Public `/hikes` and `/hikes/[slug]` query only published hikes.
   - Draft or missing detail routes use `notFound()`.
   - Rationale: mirrors existing explicit public visibility boundaries in the project.

4. Put mutations in the existing server-side data/action style.
   - Existing admin domains often place server functions in `app/_data`; if implementation finds a cleaner local convention for mutating domains, use it consistently.
   - Validation should live at the server boundary even if the client form also validates.

5. Add admin UI with a small complete workflow.
   - `/admin/hikes` lists hikes and provides create/edit/delete controls.
   - A modal form is sufficient for this slice unless the existing patterns make a dedicated `/admin/hikes/[id]` route cheaper and clearer.

## Risks / Trade-offs

- [Risk] Hike type vocabulary may not match future needs. -> Mitigation: include `OTHER` now and treat richer taxonomy as a later feature.
- [Risk] Deleting hikes now could conflict with future track/photo relations. -> Mitigation: since no relations exist in this slice, simple deletion is acceptable; future association migrations can revisit delete semantics before adding foreign keys.
- [Risk] Public pages may feel sparse before photos/maps. -> Mitigation: keep them minimal but complete, with clear empty states and no fake map/gallery placeholders.

## Migration Plan

1. Add Prisma enums/model and generate a migration.
2. Generate Prisma client using the existing project flow.
3. Add server helpers, admin/public routes, and UI.
4. Validate with `npm run tsc` and `npm run lint`; ask the user to run `npm run build` locally because this change touches Prisma and routes.
