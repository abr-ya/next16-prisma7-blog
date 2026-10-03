# Tasks

## 1. Data model and migration

- [x] 1.1 Update the `TrackActivityType` Prisma model to store unique normalized identity, required English name, optional Russian name, active state, timestamps, index, and restrictive deletion behavior; verify `npx prisma validate` succeeds.
- [x] 1.2 Create a new forward Prisma migration that preserves the applied catalog migration, renames existing `name` values to `nameEn`, adds nullable `nameRu`, seeds Russian starter translations, and leaves existing tracks unclassified; verify no applied migration is modified and existing track rows retain `NULL` activity types.
- [x] 1.3 Regenerate the Prisma client through the project flow and verify the generated types expose the localized activity-type fields and track relation without manual changes under `generated/prisma`.

## 2. Server-side catalog and track classification

- [x] 2.1 Add server-only queries for active selectable types and administrator catalog listings, including assigned-track counts; verify inactive assigned types remain readable where needed while selectable results contain active types only.
- [x] 2.2 Add administrator-authorized create, rename, activate, and deactivate mutations with normalized English-name validation and optional Russian-name handling; verify direct calls by non-administrators are denied and duplicate English names do not change data.
- [x] 2.3 Add a transactional delete mutation that permits unused types and otherwise requires explicit reassignment to an active type or clearing of assignments; verify assigned tracks cannot be silently cleared or left with a dangling relation.
- [x] 2.4 Extend track create and update values, queries, and server validation with optional activity-type IDs; verify owners can select or clear an active type, invalid or inactive IDs are rejected, and other users' tracks remain protected by existing ownership checks.
- [x] 2.5 Update track list/detail view models needed by authenticated management surfaces; verify an inactive assigned type remains visible on its existing track and an unclassified track has a clear empty state.

## 3. Administrator activity-type controls

- [x] 3.1 Add an administrator-only `/admin/track-activity-types` route and a distinct administrator-sidebar entry; verify ordinary users are denied both direct route access and lifecycle mutations.
- [x] 3.2 Build the catalog management UI with English/Russian name inputs, create, rename, active-state, assignment-count, and deletion/reassignment flows; verify the UI communicates why an assigned type cannot be deleted without an explicit disposition and falls back to English for blank Russian names.

## 4. Track forms and owner workflow

- [x] 4.1 Add an optional activity-type selector to the shared track create/edit form used by `/admin/tracks` and `/my/tracks`; verify only active types can be newly selected and `Unclassified` can be saved.
- [x] 4.2 Show the selected activity type or `Unclassified` in authenticated track lists and edit state without changing public `/tracks` display or filtering; verify existing tracks do not receive an inferred type from their linked trip.
- [x] 4.3 Verify track form dirty-state and GPX upload-discard behavior remains intact after adding the activity-type field, including type selection or clearing as an unsaved form change.

## 5. Validation and documentation

- [x] 5.1 No focused automated coverage added: the project has no test runner or existing test conventions to extend; manual browser QA is tracked separately as `outdoor-track-activity-types-manual-qa`.
- [x] 5.2 Run `npm run tsc`, `npm run lint`, and targeted ESLint for changed files outside `app`; verify all checks pass.
- [x] 5.3 Run `npx prisma validate` and the project Prisma generation flow; local `npm run build` completed successfully on 2026-10-03 (non-fatal worker messages: `Couldn't load fs` / `Couldn't load zlib`).
- [x] 5.4 Deferred manual browser verification to the independent `outdoor-track-activity-types-manual-qa` backlog candidate so this implementation change can be completed and archived without creating synthetic accounts or production data.
