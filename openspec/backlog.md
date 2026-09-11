# OpenSpec Backlog

This backlog tracks live project candidates. Completed and cancelled feature history lives in [feature-history.md](./feature-history.md).

Backlog candidates stay unnumbered until they are promoted into implementation. Promotion assigns the lowest unused `feature-XXX` number from the shared project sequence. When a large candidate is deliberately split, immediately sequential follow-up slices may be numbered together so their implementation order stays explicit.

## Status Values

- `Candidate`: identified, but scope or timing is still flexible.
- `Ready`: scope is clear enough to promote into a numbered OpenSpec change.
- `In Progress`: implementation has started and the candidate has a `feature-XXX` number.
- `Paused`: numbered work exists and should be preserved, but it is not the current implementation focus.

## Priority Values

- `P0 Now`: next or near-next work; important, unblocking, or clearly time-sensitive.
- `P1 Soon`: useful and reasonably clear, but not the immediate focus.
- `P2 Later`: valid work with known value, but sequencing is not urgent.
- `P3 Someday`: parked ideas, experiments, or large fuzzy directions.

## Numbering Rules

- `Done` numbered features live in [feature-history.md](./feature-history.md).
- Unnumbered candidates can use any free number when promoted.
- Numbered follow-up slices stay in this backlog until completed, then move to [feature-history.md](./feature-history.md).
- To promote a candidate, assign the lowest unused `feature-XXX` number after checking this file and [feature-history.md](./feature-history.md).
- Cancelled or deferred candidates do not reserve numbers; keep or move them as unnumbered history notes when useful.

## Unconfirmed Bugs

Observed issues that may be real bugs but have not been reproduced reliably enough to promote into implementation yet. Keep notes in English. Remove or promote entries once confirmed, fixed, or ruled out.

| Status | ID | Area | Summary | Notes |
| --- | --- | --- | --- | --- |
| Promoted to P0 | admin-post-save-disabled-until-interaction | posts/admin | Admin post **Save changes** stayed disabled until later interaction. | Reproduced again (2026-09-05) while writing a post. See P0 Now. |

## Outdoor Content High-Priority Roadmap

These candidates track the hikes/tracks/photos initiative as small increments. They stay unnumbered until promoted; the first promoted slice should take the next available feature number from the shared sequence.

| Order | Status | Candidate | Area | Summary |
| --- | --- | --- | --- | --- |
| 11a | Candidate | outdoor-hike-map-note-placement | outdoor/maps-notes | Let admins start a hike note directly from the map: click a coordinate, open the existing note form with latitude/longitude prefilled, then save its text, visibility, and optional hike-day assignment. Keep map-click placement separate from the base note domain. |
| 12 | Candidate | outdoor-photo-reaction-model-exploration | outdoor/photos-social | Explore simple likes (preferred over a richer rating model) for hike-linked photos: signed-in identity, duplicate prevention, public counts, and privacy boundaries. Keep text comments out of this slice — see `outdoor-photo-comments`. |
| 13 | Candidate | outdoor-photo-comments | outdoor/photos-social | Add signed-in comments on hike-linked photos (create/list, visibility through published hike association, own edit/delete policy) after the gallery viewer and preferably after a likes spike proves the social surface. Reuse the shared comment domain patterns from video comments rather than inventing a photo-only comment stack. |
| Candidate | outdoor-trip-internal-domain-api-rename | outdoor/domain | Follow feature-069 by renaming internal Hike TypeScript and Prisma APIs to Trip with mapped existing storage and a reviewed data-preserving migration; keep it separate from public route compatibility. |
| 15 | In Progress | feature-070-outdoor-trip-participants | outdoor/trips-users | Let trip owners invite existing site users by email; invitations require acceptance before membership, preserve admin override, and establish the permission base for later public contributions. |
| 17 | Candidate | outdoor-hike-owner-track-upload | outdoor/hikes-tracks | Let hike creators upload GPX tracks directly from a public hike detail page and attach those tracks to the hike, without participant track uploads yet. |
| Candidate | outdoor-trip-admin-bulk-track-association | outdoor/trips-tracks | Add checkbox selection to the admin track list, then let an admin choose one existing trip in a dialog and attach all selected tracks idempotently. Preserve independent track records and report already-linked selections clearly. |
| Candidate | outdoor-trip-public-bulk-track-association | outdoor/trips-tracks | After trip participants and public contribution permissions are implemented, let authorized trip creators/participants select eligible tracks from a public trip workflow and attach them in bulk. Define ownership, draft/public visibility, and conflict feedback separately from the admin workflow. |
| 18 | Candidate | outdoor-trip-categories-admin | outdoor/trips | Evaluate and add admin-managed trip categories or types after the hike-to-trip direction is accepted, including support for city walks or similar non-hiking trips, category add/rename behavior, migration from the current fixed hike type enum, and public/admin labeling rules. |
| 19 | Candidate | outdoor-photo-persistent-thumbnail-derivatives | outdoor/photos-media | Follow-up to feature-057: replace on-demand thumbnail generation with stored derivatives (lifecycle, cleanup, regeneration, multi-size). Also tracked under P1 Soon. |
| 20 | Candidate | outdoor-track-device-metadata-extraction | outdoor/tracks | Investigate and extract recording device details from real GPX creator metadata and vendor-specific extensions after collecting examples from Garmin, Strava, OsmAnd, Komoot, and similar sources. |
| Candidate | outdoor-track-timezone-from-route | outdoor/tracks-time | After manual source-timezone selection is proven, derive a suggested IANA timezone from the first valid GPX coordinate with a deterministic timezone-boundary dataset or service, show it for owner confirmation, and fall back to manual selection. Handle route-border/multi-timezone trips and historical DST explicitly; no AI is required. |
| Candidate | outdoor-track-naive-timestamp-normalization | outdoor/tracks-time | Interpret GPX timestamps that lack `Z` or an explicit offset as local wall-clock values in a confirmed track timezone, normalize them to UTC during reparse, and mark only affected older parses stale. Preserve already absolute GPX timestamps unchanged and never bulk-reparse automatically. |
| Candidate | outdoor-photo-capture-timezone-normalization | outdoor/photos-time | For EXIF capture times without `OffsetTimeOriginal`, require a photo timezone confirmation (optionally proposed from a linked confirmed track), normalize to UTC, and only then allow reliable automatic track-time coordinate matching or recomputation. |
| 21 | Candidate | outdoor-photo-manual-ordering | outdoor/photos | Improve manual ordering UX for hike photos after basic association order is proven, considering drag-and-drop, grid ordering, bulk reorder, and mobile behavior. |
| 22 | Candidate | outdoor-photo-albums-structure | outdoor/photos | Define and add album/grouping structure for photos after basic hike association and ordering are proven. |
| 23 | Candidate | outdoor-photos-public-gallery | outdoor/photos | Consider a standalone public photo listing/detail experience only after hike-linked photos, ordering, and album/grouping behavior prove useful. |
| Candidate | outdoor-trip-photo-contribution-quota-tiers | outdoor/trips-photos | Extend the default per-user trip photo contribution limit only after feature-072 is proven, using an explicitly designed user reputation model (for example published posts/trips and collected likes), abuse boundaries, explainable quota calculation, and safe recalculation behavior. |

## P0 Now

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Ready | admin-post-save-disabled-until-interaction | posts/admin | Analyze and fix admin post create/edit **Save changes** staying disabled until blur/scroll/console interaction. Reproduced more than once on `/admin/posts/new`. Likely `PostForm` validation gating (`mode: "onBlur"` + `disabled={!form.formState.isValid}`); confirm repro, then make save enable when required fields are valid without needing extra UI noise. |
| In Progress | feature-075-outdoor-track-source-timezone-selection | outdoor/tracks-time | **P0:** Add an explicit per-track recording-timezone setting and an administrator action to set or correct it. Display stored UTC instants in the selected IANA timezone rather than silently using each viewer's browser timezone. Preserve absolute GPX timestamps and coordinate matching; do not shift stored point times. |
| In Progress | feature-076-outdoor-photo-capture-time-context | outdoor/photos-time | Show authorized reviewers the photo's stored UTC capture instant, timezone evidence, and comparable source-track timezone range so track-time candidate explanations do not depend on unlabelled browser-local clocks. Preserve all matching behavior and defer timestamp correction to `outdoor-photo-capture-timezone-normalization`. |

## P1 Soon

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | outdoor-admin-manage-photos-use-preview-images | outdoor/admin-photos | In hike **Manage photos**, stop loading full-size originals for the attachment list thumbnails; use the same preview/thumbnail delivery path as the public hike photo surface so admin dialogs stay light. |
| Candidate | outdoor-hike-photo-viewer-loading-state | outdoor/hikes-photos | Add a visible loading indicator in the signed-in hike large-photo viewer while the first full-size image (and next/previous switches) loads from `/files/[fileId]/download`, so slow first fetches do not look like a hung UI. Keep prev/next usable; clear the loader on load or error. |
| Candidate | outdoor-photo-persistent-thumbnail-derivatives | outdoor/photos-media | Follow-up to feature-057's on-demand thumbnail shortcut: store generated thumbnail derivatives with lifecycle, cleanup, regeneration, and multi-size support once gallery usage or photo volume justifies it. Why deferred: prove guest/auth image boundaries first without derivative model, UploadThing storage, or migration scope. |
| Candidate | outdoor-hike-full-photo-viewer-audience | outdoor/hikes-photos | Follow-up to feature-057's any-signed-in full-viewer shortcut: restrict large/full hike photo viewing (and full-image download) to hike creator, accepted participants, and admins after the participants model exists. Why deferred: participants membership is not shipped yet; feature-057 only needs an authenticated vs anonymous boundary. |
| Candidate | outdoor-trip-participants-manual-qa | outdoor/trips-users | Run manual browser QA for feature-070: owner/admin invite by existing email, recipient accept/decline from `/trips/invitations`, owner/admin cancellation and removal, reinvitation after an inactive state, and denied anonymous/non-owner access. Local `npm run build` passed on 2026-09-08. Record results and fix only reproduced issues. |
| In Progress | feature-073-workspace-access-policy | auth/workspace-access | Define and enforce the active `user`/`admin` access matrix across the personal `/admin` workspace and administrator controls, including owner and accepted-participant boundaries; subsumes `admin-sidebar-role-sections`. |
| Ready | public-navbar-route-coverage-rollout | navigation/public | Move remaining primary public routes into the shared top-nav layout after the docs pilot, including home and comments, then consolidate blog/videos layout wiring and remove duplicated legacy back navigation or oversized page spacing where needed without changing public URLs or auth boundaries. |
| Candidate | public-localization-page-scope-audit | localization/public | Inventory public pages and shared components before deeper localization work, grouping pages into small slices and identifying pages that need component-level translation planning. |
| Candidate | public-home-page-localization | localization/home | Localize the public home page copy using the established app locale resource structure while preserving existing database-backed content behavior. |
| Candidate | public-docs-comments-localization | localization/public | Localize static UI copy for the public Docs listing/detail surfaces and the placeholder Comments page as a small paired slice, without translating markdown document content or comment records. |
| Candidate | public-blog-videos-list-localization | localization/public | Localize static UI copy for the Blog and Videos listing/detail surfaces after navbar/home localization is proven, keeping post/video database content unchanged. |
| Candidate | public-navbar-multi-content-search | search/public | Replace the shared public navbar search placeholder with a working public search experience across visible blog posts, markdown docs, and public videos, with a route or dialog for grouped results and explicit visibility boundaries. |
| Candidate | video-comments-own-management | video/comments | Add signed-in own-comment edit and delete controls on public video detail comment lists after earlier comment follow-ups are prioritized. |
| Candidate | admin-database-backup-generation | admin/database | Add manual admin-triggered database backup generation and download using the accepted admin database backup structure, without restore, scheduling, retention, or external storage policy. |
| Candidate | image-upload-tracking-migration | files/migration | Migrate legacy `imageUploader` route to create `FileAsset` records and count toward user storage quota, or create new tracked image route and deprecate legacy route. |
| Candidate | email-password-account-flow | auth/email | Finish first-party email/password account creation and login with form UX, mailbox-backed email verification, and password reset boundaries. |
| Candidate | dependency-upgrade-audit | dependencies | Audit and upgrade important framework/runtime packages such as Prisma, Next, React, better-auth, UploadThing, Tiptap, Radix, and ESLint in isolated groups with compatibility fixes and validation after each group. |
| Candidate | product-documentation-strategy | docs/workflow | Plan human-readable product documentation beyond OpenSpec: choose README vs repo `docs/` vs optional in-app admin help, define update rules for user-facing/admin behavior changes, and pilot the format on one area such as Content Tags legacy import (`Dry Run Selected` vs `Import Selected`). |

## P2 Later

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | outdoor-inferred-photo-coordinate-edge-case-qa | outdoor/maps-photos | Follow-up QA after feature-064 happy-path / between-days finish placement: reject→no public marker, direct EXIF GPS still wins over approved inferred, inside-window without timed timeline cannot invent along-route coords, guests/non-admins cannot use review controls. Fix only if a case fails. |
| Candidate | outdoor-photo-multi-image-vs-single-row-model | outdoor/photos | Decide whether a Photo should keep 1-3 bundled image files with aggregated EXIF summary, or whether multi-file uploads should create one Photo row per image so each row owns its own EXIF/GPS. Revisit before albums/gallery/map-marker slices lean harder on the current multi-image Photo shape. |
| Candidate | outdoor-photo-comments | outdoor/photos-social | Signed-in comments on hike-linked photos after gallery + preferably likes; reuse shared comment domain from video comments. Kept separate from `outdoor-photo-reaction-model-exploration`. |
| Candidate | video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| Candidate | video-import-export | video/tools | Add import and export workflows for saved video links. |
| Candidate | video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| Candidate | admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| Candidate | admin-user-directory-exploration | admin/users | Research and define a minimal admin-only user directory: list/search existing accounts; view safe operational fields (name, email, avatar, role, creation/update timestamps); and assess lightweight per-user relationship summaries such as post/photo/track/trip counts and most-recent activity. Prefer precomputed or aggregate counts and a narrow latest-activity projection over loading full media/content collections. Decide whether mutations or a detailed activity/history view belong in later, separately authorized slices; do not expose password, session, account-token, or other credential data. |
| Candidate | saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| Candidate | public-comments-unified-feed | comments/public | Implement the standalone `/comments` page as a unified public comments feed across supported visible targets, replacing the current placeholder. |
| Candidate | video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| Candidate | public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| Candidate | content-tags-migration-verification-pass | content/tags | Run a real admin content-tag migration and cleanup verification pass after assignment actions ship: exercise legacy import, shared tag inventory cleanup, selected assignment remove/replace, and document any data/UI follow-ups. |
| Candidate | video-comments-edit-delete-expiry | video/comments | Prevent editing and deleting own comments after they are more than 24 hours old. |
| Candidate | github-oauth-credentials-validation | auth/github | Create environment-specific GitHub OAuth credentials, document required callback URLs, and manually verify the live GitHub sign-in/sign-up integration after the code-level flow is complete. |

## P3 Someday

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | admin-file-category-drill-down | files/admin | Add purpose-filtered file views in admin file manager with category-specific listing, previews, stats, and management controls accessible from settings breakdown. |
| Candidate | site-settings-storage-structure | admin/settings | Define project-wide site settings storage strategy (env variables vs database table vs config file) for editable admin controls including persistence, hot reload, versioning, and audit boundaries. |
| Candidate | file-upload-domain-isolation | files/upload | Add full domain isolation for file uploads using server-side proxy or signed URLs so browser never sees UploadThing provider URLs during upload or download. |
| Candidate | per-user-storage-quota-configuration | files/admin | Add per-user configurable storage quotas with database-backed limits, allowing admins to set different storage limits for individual users instead of site-wide constant. |
