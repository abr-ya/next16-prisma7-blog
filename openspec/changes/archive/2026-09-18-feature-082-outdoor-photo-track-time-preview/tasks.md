## 1. Protected preview data

- [x] 1.1 Extend the owner-or-admin photo coordinate-review detail projection with a serializable preview model only for eligible inside-track-window candidates, including source-track map geometry and usable timed points.
- [x] 1.2 Keep preview data absent for unauthorized viewers and for between-track, after-finish, unresolved, or timeline-less candidates.
- [x] 1.3 Add a pure preview resolver that derives a temporary timestamp and coordinate for the fixed -3 through +3 hour offsets, returning an explicit outside-timeline state instead of endpoint clamping.

## 2. Coordinate-review preview UI

- [x] 2.1 Add fixed accessible offset controls through -3 to +3 hours and an explicit temporary-preview label to the eligible candidate in the coordinate-review modal.
- [x] 2.2 Render a compact client-only map fragment with the authorized source track, original/proposed state, and the selected preview marker.
- [x] 2.3 Update previewed timestamp and coordinate when the selected offset changes, and show the outside-track state without inventing a marker.
- [x] 2.4 Preserve current candidate explanations, approval/rejection/manual-correction actions, and ensure the offset is never sent through approval or persisted.

## 3. Verification and documentation

- [x] 3.1 Mark `outdoor-photo-track-time-preview` as In Progress under `feature-082-outdoor-photo-track-time-preview` in the outdoor backlog.
- [x] 3.2 Run `openspec validate feature-082-outdoor-photo-track-time-preview --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` when changed `app` files require it.
- [x] 3.3 Ask the user to run `npm run build` locally and manually verify eligible inside-track preview offsets, outside-track behavior, approval non-persistence, manual correction, and unauthorized/non-eligible candidate boundaries.

## Validation Notes

- `npm run tsc`, targeted ESLint, `openspec validate feature-082-outdoor-photo-track-time-preview --strict`, and `git diff --check` passed.
- Manual browser verification passed before archive for the coordinate-review time-offset preview.
- Local `npm run build` completed successfully on 2026-09-18. Next.js emitted non-fatal `Couldn't load fs` / `Couldn't load zlib` messages while collecting page data.
