## Context

The project currently has two tag shapes:

- Videos use normalized reusable records with `VideoTag`, `VideosToVideoTags`, slug-based de-duplication, and passive public badges.
- Posts store tags as `Post.tags String[]`, and the post form writes raw select values directly into that array.

This feature is architecture-first. It defines the shared tag domain before posts, docs, files, or other content areas gain richer tag behavior. The design must preserve existing video behavior and existing post data while giving future implementation slices a single direction.

## Goals / Non-Goals

**Goals:**

- Define a shared content tag vocabulary for tag records, tag assignments, normalization, ownership, visibility, and public display.
- Establish how current video tags map into the shared architecture without requiring an immediate rewrite.
- Establish how current post string tags can move toward normalized records without data loss.
- Split future implementation into small slices with clear migration and validation boundaries.

**Non-Goals:**

- No Prisma schema changes in this architecture slice.
- No migration of `Post.tags` or `VideoTag` data in this architecture slice.
- No public tag filters, tag pages, tag search, tag colors, aliases, merge/delete workflows, or admin tag manager in this architecture slice.
- No change to current route behavior for `/admin/posts`, `/admin/videos`, `/blog`, `/videos`, or detail pages.

## Decisions

### Shared Tags Are A Project Domain, Not A Video Refactor

The target architecture introduces shared content tags as a first-class domain with these concepts:

- `ContentTag`: reusable tag record with normalized `name`, unique `slug`, timestamps, and optional future metadata.
- `ContentTagAssignment`: a content-type-specific assignment between one content entity and one tag, with an `assignedAt` timestamp.
- `ContentTagInput`: a shared form/action input shape compatible with existing `{ label, value }` selectors.
- shared helpers for whitespace normalization, slug generation, de-duplication, and sorted output.

Alternative considered: rename `VideoTag` into a universal `Tag` immediately. That would make the architecture look cleaner, but it creates unnecessary migration risk and touches working video behavior too early.

### Use Typed Assignments Instead Of A Single Polymorphic Join First

Future implementation slices should prefer typed assignment tables such as `PostsToContentTags` and, if video tags are migrated, `VideosToContentTags`. This keeps Prisma relations explicit, preserves database foreign keys, and makes ownership and visibility checks easier to audit.

Alternative considered: one polymorphic join table with `contentType` and `contentId`. That is flexible, but Prisma and PostgreSQL cannot enforce all target-row foreign keys directly, so it is a worse first fit for this app.

### Treat Existing Video Tags As The Proven Contract

Video tags already prove the core behavior: admins can create/select reusable tags, names normalize into slugs, duplicate inputs collapse, videos without tags remain valid, and public video badges are passive metadata. Future shared-tag work must preserve that behavior before changing storage or UI.

Alternative considered: rewrite videos to shared tags before touching posts. That may be useful later, but it should be a separate compatibility slice after the shared contract is accepted.

### Split Post Adoption From Legacy Post Tag Migration

Current post tags should remain readable and editable while posts move to the shared tag system. Plan post adoption as a separate implementation slice that adds shared post/tag storage and teaches post reads/writes to use it for new edits. Plan legacy `Post.tags` review and transfer as a later controlled migration slice so existing tag values can be inspected, merged, renamed, or dropped before they become canonical shared tags.

Alternative considered: combine post adoption and old tag migration in one slice. That is faster, but it gives less control over legacy tag cleanup and makes it harder to review ambiguous tag values before they become shared records.

### Manage Tags In A Content-Wide Admin Surface

Dedicated tag management should be planned as a content-wide admin feature, not a video-only tool. It should eventually handle rename, merge, delete/detach, usage counts by content type, and review states for legacy imports while preserving content-specific visibility and ownership rules.

Alternative considered: build separate tag managers for videos and posts. That matches today's storage split, but it would duplicate workflows exactly where the project is trying to introduce a shared tag domain.

### Keep Public Visibility Attached To Content, Not Tags

Tag records are metadata. Public exposure must be determined by the tagged content's own visibility rules: video visibility, post status, doc publication rules, file visibility, and future content contracts. Public tag pages or filters must never reveal private/unpublished assignments.

Alternative considered: put visibility directly on tags. That is useful for moderation or hidden tags later, but it does not replace content-level access checks.

## Risks / Trade-offs

- Schema drift between old video tags and future shared tags -> Mitigation: keep video behavior as the reference contract and require compatibility tests before any video migration.
- Post tag migration could lose spelling, casing, or intentionally separate meanings -> Mitigation: split legacy migration into a controlled review feature where ambiguous tags can be merged, renamed, or dropped before transfer.
- Shared tags may become too broad too early -> Mitigation: keep this feature architecture-only and split concrete implementation into follow-up slices.
- Public tag surfaces may leak private content counts -> Mitigation: require all public tag reads to join through public content filters, not raw assignment totals.
- Typed assignment tables add more schema objects than a polymorphic join -> Mitigation: accept the small schema cost in exchange for referential integrity and simpler Prisma queries.

## Migration Plan

1. Accept this architecture as `content-tags` without runtime changes.
2. Add a follow-up shared helper slice that extracts generic normalization/input helpers while preserving `lib/video-tags.ts` compatibility.
3. Add a post adoption slice that creates shared tag records and typed post assignments for new/edited post tags while preserving legacy `Post.tags` readability.
4. Add a controlled legacy post tag review/migration slice after post adoption so old tags can be inspected, merged, removed, and then transferred.
5. Add a content-wide admin tag management slice after the shared tag model exists.
6. Add public filtering/tag pages only after data compatibility and admin management boundaries are proven.
7. Consider migrating video storage from `VideoTag` to shared tags only after post adoption and helper extraction are stable.

Rollback for future implementation slices should preserve original string or video-tag data until the replacement readers and writes are validated.

## Open Questions

- Should shared tags be global across all users, owner-scoped, or mixed by content type?
- Should docs use shared tags, or should docs wait until post and video behavior is stable?
- Should tags eventually support display metadata such as description, color, icon, or ordering?
- Should public tag URLs use `/tags/{slug}` globally or content-scoped routes like `/blog/tag/{slug}` and `/videos?tag={slug}`?
