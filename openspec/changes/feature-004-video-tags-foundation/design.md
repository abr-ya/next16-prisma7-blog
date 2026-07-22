## Context

The video library currently has channels, visibility, provider metadata, admin/public lists, and public detail pages. Blog posts already store simple string tags, but videos do not have tag data and the backlog asks for reusable video tags as a separate video-library concern.

## Goals / Non-Goals

**Goals:**

- Add a durable video tag data model that can support later filtering and management.
- Let authenticated admins assign tags while creating or editing videos.
- Display assigned tag badges in existing admin and public video surfaces.
- Keep the implementation small enough to validate and review as one schema-backed increment.

**Non-Goals:**

- Public tag filtering on `/videos` is deferred to `feature-014-public-video-tag-filtering`.
- Dedicated tag management workflows are deferred to `feature-015-video-tag-management`.
- Full-text search remains in `feature-006-video-search`.
- Tag colors, custom ordering, aliases, and merge behavior are out of scope.

## Decisions

- Use reusable video tag records plus an explicit many-to-many relation instead of a `String[]` field on `Video`.
  This keeps video tags queryable and ready for later filters without rewriting stored data. The trade-off is one migration and relation include/update logic now.

- Normalize tag names on save and enforce uniqueness through a normalized slug.
  Admins can type human-readable labels, while the system prevents duplicates caused by casing or whitespace differences. Slug generation should be deterministic and local to the video tag helpers.

- Keep tag assignment owner-scoped through video ownership, not tag ownership.
  Tags are reusable vocabulary for the video library, while edits to a video's assignments still require the current user to own that video.

- Display tags as passive badges only in this slice.
  Public pages may show tags attached to public videos, but tags do not become navigable filters until a later feature defines URL behavior and fallback rules.

## Risks / Trade-offs

- Schema migration risk -> Keep the migration additive: new tag tables and relation rows only, with no reset or rewrite of existing video/channel data.
- Duplicate tag risk -> Normalize names before create/connect and enforce a unique slug.
- Public leakage risk -> Only include tag badges through existing public video queries that already filter videos by `PUBLIC` visibility.
- UX scope creep -> Do not add tag CRUD, colors, or public filtering controls in this feature.

## Migration Plan

- Add `VideoTag` and a video/tag relation in Prisma.
- Generate and apply a normal additive migration through the existing Prisma flow.
- Regenerate the Prisma client using the project flow.
- Rollback, if needed, is the standard migration rollback path before production data depends on tags; no existing rows should be changed by this migration.

## Open Questions

- Should tag slugs be exposed in public URLs later, or should public filtering use tag ids?
- Should future tag management allow global tags, per-user tags, or both?
