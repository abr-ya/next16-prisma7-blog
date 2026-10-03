# Tasks

## 1. Data model and migration

- [x] 1.1 Add the `TrackActivityType` Prisma model and nullable `Track.activityTypeId` relation with a unique normalized identity, active state, timestamps, index, and restrictive deletion behavior; verify `npx prisma validate` succeeds.
- [x] 1.2 Create a new forward Prisma migration that adds the catalog and nullable relation, seeds the agreed starter activity types idempotently, and leaves existing tracks unclassified; verify no applied migration is modified and existing track rows retain `NULL` activity types.
- [x] 1.3 Regenerate the Prisma client through the project flow and verify the generated types expose the new relation without manual changes under `generated/prisma`.

## 2. Server-side catalog and track classification

- [ ] 2.1 Add server-only queries for active selectable types and administrator catalog listings, including assigned-track counts; verify inactive assigned types remain readable where needed while selectable results contain active types only.
- [ ] 2.2 Add administrator-authorized create, rename, activate, and deactivate mutations with normalized-name validation; verify direct calls by non-administrators are denied and duplicate names do not change data.
- [ ] 2.3 Add a transactional delete mutation that permits unused types and otherwise requires explicit reassignment to an active type or clearing of assignments; verify assigned tracks cannot be silently cleared or left with a dangling relation.
- [ ] 2.4 Extend track create and update values, queries, and server validation with optional activity-type IDs; verify owners can select or clear an active type, invalid or inactive IDs are rejected, and other users' tracks remain protected by existing ownership checks.
- [ ] 2.5 Update track list/detail view models needed by authenticated management surfaces; verify an inactive assigned type remains visible on its existing track and an unclassified track has a clear empty state.

## 3. Administrator activity-type controls

- [ ] 3.1 Add an administrator-only `/admin/track-activity-types` route and a distinct administrator-sidebar entry; verify ordinary users are denied both direct route access and lifecycle mutations.
- [ ] 3.2 Build the catalog management UI with create, rename, active-state, assignment-count, and deletion/reassignment flows; verify the UI communicates why an assigned type cannot be deleted without an explicit disposition.

## 4. Track forms and owner workflow

- [ ] 4.1 Add an optional activity-type selector to the shared track create/edit form used by `/admin/tracks` and `/my/tracks`; verify only active types can be newly selected and `Unclassified` can be saved.
- [ ] 4.2 Show the selected activity type or `Unclassified` in authenticated track lists and edit state without changing public `/tracks` display or filtering; verify existing tracks do not receive an inferred type from their linked trip.
- [ ] 4.3 Verify track form dirty-state and GPX upload-discard behavior remains intact after adding the activity-type field, including type selection or clearing as an unsaved form change.

## 5. Validation and documentation

- [ ] 5.1 Add focused automated coverage where the existing project test conventions support it for name normalization, active-type validation, deletion/reassignment, and owner/admin authorization; verify the relevant tests pass.
- [ ] 5.2 Run `npm run tsc`, `npm run lint`, and targeted ESLint for changed files outside `app`; verify all checks pass.
- [ ] 5.3 Run `npx prisma validate` and the project Prisma generation flow; ask the user to run `npm run build` locally and record the result because the sandbox may not fetch Next.js font resources.
- [ ] 5.4 Manually verify administrator catalog lifecycle, existing unclassified tracks, owner type selection/clearing, inactive-type behavior, non-owner denial, and narrow/desktop layout; update this checklist and `openspec/backlog.md` with results before archive.
