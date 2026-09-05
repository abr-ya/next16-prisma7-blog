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
| 8 | Ready | feature-061-outdoor-photo-track-time-matching-spike | outdoor/maps-photos | Admin-only spike after feature-060: for hike-linked photos without EXIF GPS, propose track-time match candidates (inside a track recording window, or between nearby adjacent tracks), show them in a modal, and on accept only log the choice — no persistence and no public inferred markers. |
| 9 | Candidate | outdoor-photo-track-time-inferred-coordinates | outdoor/maps-photos | After feature-061 spike learnings: persist inferred photo coordinates from capture timestamps and track timelines, with provenance, confidence, admin approval, and manual correction before public map display. May also require retaining timestamped trackpoint context beyond start/end summaries. |
| 10 | Candidate | outdoor-hike-map-day-filter | outdoor/maps | Add an all-days/single-day map filter for linked track geometry and photo markers after temporal semantics and coordinate sources are accepted. |
| 11 | Candidate | outdoor-hike-map-notes-layer | outdoor/maps-notes | Add hike notes as a future map layer after the hike note entity is designed, including coordinate/date visibility and public/private boundaries. |
| 12 | Candidate | outdoor-photo-reaction-model-exploration | outdoor/photos-social | Explore simple likes (preferred over a richer rating model) for hike-linked photos: signed-in identity, duplicate prevention, public counts, and privacy boundaries. Keep text comments out of this slice — see `outdoor-photo-comments`. |
| 13 | Candidate | outdoor-photo-comments | outdoor/photos-social | Add signed-in comments on hike-linked photos (create/list, visibility through published hike association, own edit/delete policy) after the gallery viewer and preferably after a likes spike proves the social surface. Reuse the shared comment domain patterns from video comments rather than inventing a photo-only comment stack. |
| 14 | Candidate | outdoor-hike-to-trip-domain-rename | outdoor/domain | Evaluate and, if accepted, rename the hike-centered domain from `Hike`/`/hikes` toward `OutdoorTrip` or `Trip`, including model names, routes, copy, redirects, specs, and data-preserving migration strategy. Keep `Photo` as an independent reusable entity rather than narrowing it to `TripPhoto`; rename hike-specific associations/actions such as hike-photo ordering to trip terminology; preserve existing data through table/type/column renames rather than drop/create migrations. |
| 15 | Candidate | outdoor-hike-participants | outdoor/hikes-users | Let hike creators manage participants for a hike, preserving admin override and using membership as the permission base for public contribution controls. |
| 16 | Candidate | outdoor-hike-public-photo-upload | outdoor/hikes-photos | Let hike creators and participants upload photos directly from a public hike detail page and attach those photos to the hike. |
| 17 | Candidate | outdoor-hike-owner-track-upload | outdoor/hikes-tracks | Let hike creators upload GPX tracks directly from a public hike detail page and attach those tracks to the hike, without participant track uploads yet. |
| 18 | Candidate | outdoor-trip-categories-admin | outdoor/trips | Evaluate and add admin-managed trip categories or types after the hike-to-trip direction is accepted, including support for city walks or similar non-hiking trips, category add/rename behavior, migration from the current fixed hike type enum, and public/admin labeling rules. |
| 19 | Candidate | outdoor-photo-persistent-thumbnail-derivatives | outdoor/photos-media | Follow-up to feature-057: replace on-demand thumbnail generation with stored derivatives (lifecycle, cleanup, regeneration, multi-size). Also tracked under P1 Soon. |
| 20 | Candidate | outdoor-track-recording-summary | outdoor/tracks | Show compact GPX recording stats from stored parsed metadata: distance plus recording start/end date-time, and parse/store the GPX `creator` value. Use the same visibility-safe fields on public track detail summaries, admin track summaries, and the linked-track cards on `/hikes/[slug]` under the combined hike map, omitting fields when time or distance is unavailable. |
| 21 | Candidate | outdoor-track-device-metadata-extraction | outdoor/tracks | Investigate and extract recording device details from real GPX creator metadata and vendor-specific extensions after collecting examples from Garmin, Strava, OsmAnd, Komoot, and similar sources. |
| 22 | Candidate | outdoor-photo-manual-ordering | outdoor/photos | Improve manual ordering UX for hike photos after basic association order is proven, considering drag-and-drop, grid ordering, bulk reorder, and mobile behavior. |
| 23 | Candidate | outdoor-photo-albums-structure | outdoor/photos | Define and add album/grouping structure for photos after basic hike association and ordering are proven. |
| 24 | Candidate | outdoor-photos-public-gallery | outdoor/photos | Consider a standalone public photo listing/detail experience only after hike-linked photos, ordering, and album/grouping behavior prove useful. |

## P0 Now

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| In Progress | outdoor-photo-thumbnail-vercel-500 | outdoor/photos-media | Fix production `GET /files/[fileId]/thumbnail` returning **500** on Vercel after feature-057 on-demand `sharp` thumbnails. Branch `fix-outdoor-photo-thumbnail-vercel-500`: keep `sharp` external, force-trace `@img/sharp*` native binaries into the thumbnail serverless function, pin Node.js runtime. |
| Ready | admin-post-save-disabled-until-interaction | posts/admin | Analyze and fix admin post create/edit **Save changes** staying disabled until blur/scroll/console interaction. Reproduced more than once on `/admin/posts/new`. Likely `PostForm` validation gating (`mode: "onBlur"` + `disabled={!form.formState.isValid}`); confirm repro, then make save enable when required fields are valid without needing extra UI noise. |

## P1 Soon

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | outdoor-photo-persistent-thumbnail-derivatives | outdoor/photos-media | Follow-up to feature-057's on-demand thumbnail shortcut: store generated thumbnail derivatives with lifecycle, cleanup, regeneration, and multi-size support once gallery usage or photo volume justifies it. Why deferred: prove guest/auth image boundaries first without derivative model, UploadThing storage, or migration scope. |
| Candidate | outdoor-hike-full-photo-viewer-audience | outdoor/hikes-photos | Follow-up to feature-057's any-signed-in full-viewer shortcut: restrict large/full hike photo viewing (and full-image download) to hike creator, accepted participants, and admins after the participants model exists. Why deferred: participants membership is not shipped yet; feature-057 only needs an authenticated vs anonymous boundary. |
| Ready | admin-sidebar-role-sections | navigation/admin | Split the admin sidebar into explicit signed-in workspace and admin-only control sections while keeping server-side role checks as the authorization boundary. |
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
| Candidate | outdoor-photo-multi-image-vs-single-row-model | outdoor/photos | Decide whether a Photo should keep 1-3 bundled image files with aggregated EXIF summary, or whether multi-file uploads should create one Photo row per image so each row owns its own EXIF/GPS. Revisit before albums/gallery/map-marker slices lean harder on the current multi-image Photo shape. |
| Candidate | outdoor-photo-comments | outdoor/photos-social | Signed-in comments on hike-linked photos after gallery + preferably likes; reuse shared comment domain from video comments. Kept separate from `outdoor-photo-reaction-model-exploration`. |
| Candidate | video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| Candidate | video-import-export | video/tools | Add import and export workflows for saved video links. |
| Candidate | video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| Candidate | admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
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
