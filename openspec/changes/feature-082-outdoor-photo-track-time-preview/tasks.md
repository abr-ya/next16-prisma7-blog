## 1. Protected preview data

- [ ] 1.1 Extend the owner-or-admin photo coordinate-review detail projection with a serializable preview model only for eligible inside-track-window candidates, including source-track map geometry and usable timed points.
- [ ] 1.2 Keep preview data absent for unauthorized viewers and for between-track, after-finish, unresolved, or timeline-less candidates.
- [ ] 1.3 Add a pure preview resolver that derives a temporary timestamp and coordinate for the fixed -2 through +2 hour offsets, returning an explicit outside-timeline state instead of endpoint clamping.

## 2. Coordinate-review preview UI

- [ ] 2.1 Add fixed accessible offset controls and an explicit temporary-preview label to the eligible candidate in the coordinate-review modal.
- [ ] 2.2 Render a compact client-only map fragment with the authorized source track, original/proposed state, and the selected preview marker.
- [ ] 2.3 Update previewed timestamp and coordinate when the selected offset changes, and show the outside-track state without inventing a marker.
- [ ] 2.4 Preserve current candidate explanations, approval/rejection/manual-correction actions, and ensure the offset is never sent through approval or persisted.

## 3. Verification and documentation

- [ ] 3.1 Mark `outdoor-photo-track-time-preview` as In Progress under `feature-082-outdoor-photo-track-time-preview` in the outdoor backlog.
- [ ] 3.2 Run `openspec validate feature-082-outdoor-photo-track-time-preview --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` when changed `app` files require it.
- [ ] 3.3 Ask the user to run `npm run build` locally and manually verify eligible inside-track preview offsets, outside-track behavior, approval non-persistence, manual correction, and unauthorized/non-eligible candidate boundaries.
