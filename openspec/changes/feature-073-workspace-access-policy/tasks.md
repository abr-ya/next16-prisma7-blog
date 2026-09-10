## 1. Access-policy inventory

- [ ] 1.1 Audit the current `/admin` routes, sidebar entries, server pages, server actions, and data helpers for posts, tracks, trips, photos, files, map review, and site controls.
- [ ] 1.2 Add a concise access matrix that records the active `user`/`admin` roles, ownership and accepted-participant scopes, allowed routes/actions, and denial behavior.
- [ ] 1.3 Reconcile the matrix with existing OpenSpec role, file, trip, and contribution requirements; record deferred roles and unaudited domains explicitly.

## 2. Server authorization alignment

- [ ] 2.1 Add or consolidate narrow server-only authorization helpers for authenticated user, owner-or-admin, and explicit administrator control checks.
- [ ] 2.2 Apply owner-scoped checks to audited post, track, and trip reads/mutations so direct action calls cannot read, mutate, or reassign another user's content.
- [ ] 2.3 Apply explicit administrator checks to audited cross-user media association, photo/file lifecycle, map-review, and global-control operations; preserve only the accepted participant contribution path.
- [ ] 2.4 Update audited data projections so denied actors do not receive protected records merely because a page shell is session-gated.

## 3. Workspace navigation and routes

- [ ] 3.1 Split the `/admin` sidebar into Personal workspace and Administrator controls using the approved matrix, without treating sidebar visibility as authorization.
- [ ] 3.2 Adapt audited personal workspace pages to show only owner-scoped records and omit administrator-only controls for ordinary users.
- [ ] 3.3 Give direct requests to administrator-only routes a safe consistent denial and verify no protected page data is rendered first.

## 4. Verification and documentation

- [ ] 4.1 Add focused authorization coverage or deterministic checks for anonymous visitor, ordinary user, owner, accepted participant, and administrator across representative audited actions.
- [ ] 4.2 Update the access matrix and relevant project documentation when an implementation decision changes the audited policy.
- [ ] 4.3 Run `openspec validate feature-073-workspace-access-policy --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 4.4 Ask the user to run `npm run build` locally and manually verify personal-workspace navigation, direct denial of admin controls, own-content management, participant-only trip contribution, and administrator overrides.
