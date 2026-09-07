## 1. Hike-note data foundation

- [x] 1.1 Add the `HikeNoteStatus` enum, `HikeNote` model, and `Hike.notes` relation to the Prisma schema with coordinate/day/status indexes appropriate for hike-scoped reads.
- [x] 1.2 Create and validate the additive Prisma migration; regenerate the Prisma client through the existing project flow.
- [x] 1.3 Add shared note input and public/admin view-model types plus date-key and coordinate-pair validation helpers.

## 2. Admin note management

- [x] 2.1 Add admin-authorized server actions for hike-note create, update, and confirmed delete, including hike ownership, status, coordinate, and inclusive day-range validation.
- [x] 2.2 Extend the admin hike management surface with a focused note list and create/edit controls using existing UI primitives.
- [x] 2.3 Revalidate the relevant admin hike and public hike paths after note mutations and show actionable validation/mutation feedback.

## 3. Public map note layer

- [x] 3.1 Extend the published hike data read with a visibility-safe note-marker projection that includes only published coordinate-bearing notes on published hikes.
- [x] 3.2 Render note markers and title/body popup content in the existing hike map, including their bounds in all-days and selected-day views.
- [x] 3.3 Keep undated note markers all-days-only, exclude drafts and coordinate-less notes, and preserve the selected-day empty-state behavior.

## 4. Documentation and validation

- [x] 4.1 Update relevant project documentation or checklists if the admin hike workflow or outdoor map notes are already documented there.
- [x] 4.2 Run `openspec validate feature-068-outdoor-hike-map-notes-layer --strict`.
- [x] 4.3 Run `npm run tsc` and targeted ESLint for changed non-`app` files.
- [ ] 4.4 Ask the user to run `npm run build` locally and manually verify admin draft/published notes, coordinate/day validation, all-days and selected-day map markers, undated notes, and public non-exposure of drafts.
