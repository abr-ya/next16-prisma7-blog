## 1. Access-policy inventory

- [x] 1.1 Audit the current `/admin` routes, sidebar entries, server pages, server actions, and data helpers for posts, tracks, trips, photos, files, map review, and site controls.
- [x] 1.2 Add a concise access matrix that records the active `user`/`admin` roles, ownership and accepted-participant scopes, allowed routes/actions, and denial behavior, including own-photo EXIF/coordinate actions versus administrator cross-user override. (Published in `docs/workspace-access-policy.md`.)
- [x] 1.3 Reconcile the matrix with existing OpenSpec role, file, trip, and contribution requirements; record deferred roles and unaudited domains explicitly. (See Reconciliation / Unaudited sections of the matrix.)

## 2. Server authorization alignment

- [x] 2.1 Add or consolidate narrow server-only authorization helpers for authenticated user, owner-or-admin, and explicit administrator control checks. (`AuthorizationError`, `requireActionUser`, `requireAdminControl`, `requireOwnerOrAdmin` in `lib/auth-utils.ts`.)
- [x] 2.2 Apply owner-scoped checks to audited post, track, and trip reads/mutations so direct action calls cannot read, mutate, or reassign another user's content. (`getPostById`/`updatePost`/`connectLinkToPost` owner-or-admin with no `userId` reassignment; `updateCategory` owner-or-admin; tracks/hikes already owner-scoped per audit.)
- [x] 2.3 Apply owner-or-admin checks to own-photo EXIF/coordinate operations and explicit administrator checks to audited cross-user media association, photo/file lifecycle, and global-control operations; preserve only the accepted participant contribution path. (Photo EXIF/coordinate policy already admin∥owner per `lib/hike-photo-detail-policy.ts`; association/lifecycle/content-tags already admin; md-docs CRUD and video-channel mutations moved to `requireAdminControl`; `assertOwnerOrAdminAccess` uses `hasAdminRole`; legacy `imageUploader` session-gated. Dead-code `getVideoChannelById` left session-only — no consumers.)
- [x] 2.4 Update audited data projections so denied actors do not receive protected records merely because a page shell is session-gated. (Categories/links owner-scoped; dashboard todo resolved; content-tag vocabulary read documented as accepted in the matrix.)

## 3. Workspace navigation and routes

- [x] 3.1 Split the `/admin` sidebar into Personal workspace and Administrator controls using the approved matrix, without treating sidebar visibility as authorization.
- [x] 3.2 Adapt audited personal workspace pages to show only owner-scoped records and omit administrator-only controls for ordinary users. (Trips load cross-user photo options and render association/map-review/note controls only for administrators.)
- [x] 3.3 Give direct requests to administrator-only routes a safe consistent denial and verify no protected page data is rendered first. (`/admin/md-docs*` and `/admin/video-channels` now call `requireAdmin` before reads; existing photos/files/content-tags/database guards retained.)

## 4. Verification and documentation

- [x] 4.1 Add focused authorization coverage or deterministic checks for anonymous visitor, ordinary user, owner, accepted participant, and administrator across representative audited actions. (`npm run check:workspace-access-policy` verifies navigation/route guards, owner scopes, admin media boundary, and participant contribution path.)
- [x] 4.2 Update the access matrix and relevant project documentation when an implementation decision changes the audited policy. (Recorded phase-3 navigation and route-guard completion.)
- [x] 4.3 Run `openspec validate feature-073-workspace-access-policy --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [x] 4.4 Ask the user to run `npm run build` locally and manually verify personal-workspace navigation, direct denial of admin controls, own-content management, participant-only trip contribution, and administrator overrides. (`npm run build` passed on 2026-09-20; browser QA deferred to `workspace-access-policy-manual-qa` in the backlog.)
