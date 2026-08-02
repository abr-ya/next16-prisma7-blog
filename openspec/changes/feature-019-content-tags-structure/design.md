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

### Treat `Post.tags String[]` As Legacy-Compatible Data

Current post tags should remain readable and editable until a dedicated migration exists. Plan that migration as `feature-029-content-tags-post-normalization`: it should read existing string tags, normalize them into shared tag records, create post/tag assignments, and keep a rollback path or compatibility reader until the array can be retired safely. Manual cleanup should be reserved for ambiguous slug/name conflicts, not for routine tag transfer.

Alternative considered: leave posts on string arrays indefinitely. That keeps implementation cheap but blocks shared tag browsing, tag reuse, and consistent public/admin behavior.

### Keep Public Visibility Attached To Content, Not Tags

Tag records are metadata. Public exposure must be determined by the tagged content's own visibility rules: video visibility, post status, doc publication rules, file visibility, and future content contracts. Public tag pages or filters must never reveal private/unpublished assignments.

Alternative considered: put visibility directly on tags. That is useful for moderation or hidden tags later, but it does not replace content-level access checks.

## Risks / Trade-offs

- Schema drift between old video tags and future shared tags -> Mitigation: keep video behavior as the reference contract and require compatibility tests before any video migration.
- Post tag migration could lose spelling or casing choices -> Mitigation: define normalized slug identity while preserving display `name` from first or latest accepted canonical value; require manual review only for ambiguous conflicts.
- Shared tags may become too broad too early -> Mitigation: keep this feature architecture-only and split concrete implementation into follow-up slices.
- Public tag surfaces may leak private content counts -> Mitigation: require all public tag reads to join through public content filters, not raw assignment totals.
- Typed assignment tables add more schema objects than a polymorphic join -> Mitigation: accept the small schema cost in exchange for referential integrity and simpler Prisma queries.

## Migration Plan

1. Accept this architecture as `content-tags` without runtime changes.
2. Add a follow-up shared helper slice that extracts generic normalization/input helpers while preserving `lib/video-tags.ts` compatibility.
3. Add `feature-029-content-tags-post-normalization` to create shared tag records and typed post assignments from existing `Post.tags`.
4. Add public/admin behavior slices only after data compatibility is proven.
5. Consider migrating video storage from `VideoTag` to shared tags only after post normalization and helper extraction are stable.

Rollback for future implementation slices should preserve original string or video-tag data until the replacement readers and writes are validated.

## Open Questions

- Should shared tags be global across all users, owner-scoped, or mixed by content type?
- Should docs use shared tags, or should docs wait until post and video behavior is stable?
- Should tags eventually support display metadata such as description, color, icon, or ordering?
- Should public tag URLs use `/tags/{slug}` globally or content-scoped routes like `/blog/tag/{slug}` and `/videos?tag={slug}`?
