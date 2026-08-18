## Context

Posts now use shared `ContentTag` records and `PostsToContentTags` assignments for new edits, while old `Post.tags String[]` values remain readable as legacy fallback. The next cleanup step should not bulk-promote old string values directly into canonical tags because those values may need review, merge, replacement, or removal.

This feature introduces a tag review state before the legacy migration. The status is a data-quality signal for admins, not a visibility or publishing state.

## Goals / Non-Goals

**Goals:**

- Add a status to `ContentTag` that distinguishes reviewed tags from tags that need admin review.
- Treat all existing shared tags as reviewed by default.
- Let admins mark any shared tag as needs-review or reviewed.
- Show needs-review tags with linked post usage so admins can make cleanup decisions in context.
- Support resolving a needs-review tag by approving it, removing selected assignments, replacing selected assignments with another tag, or merging the whole tag into another tag.
- Preserve public tag rendering and routing for all tag statuses.

**Non-Goals:**

- Importing legacy `Post.tags` values.
- Changing public visibility, public tag filters, or `/blog/tag/{tag}` semantics.
- Migrating video tags or adding status to `VideoTag`.
- Full content-wide metadata management beyond the review actions above.

## Decisions

### Status Names

Use a status that avoids implying unpublished content:

- `ACTIVE`: reviewed, normal shared tag.
- `NEEDS_REVIEW`: tag is usable but requires admin cleanup or approval.

`DRAFT` is avoided because it sounds hidden from users. Public surfaces must treat both statuses the same.

### Data Model

Add an enum and status field:

```prisma
enum ContentTagStatus {
  ACTIVE
  NEEDS_REVIEW
}

model ContentTag {
  status ContentTagStatus @default(ACTIVE)
}
```

Existing rows receive the default active value. Later legacy import can create or mark tags as `NEEDS_REVIEW`.

### Public Behavior

Tag status is not a visibility boundary:

- Public blog listing/detail badges render assigned tags regardless of status.
- Existing post tag links keep their current display-name based behavior.
- Legacy fallback from `Post.tags` remains unchanged.
- Public queries must not filter out `NEEDS_REVIEW` tags.

### Admin Review Surface

Add an admin-only review view or section focused on shared content tags that need review. It should show:

- tag name, slug, and status;
- linked post count;
- linked post titles/slugs/statuses where available;
- actions to mark reviewed, mark needs-review, remove from selected posts, replace with another tag, or merge into another tag.

The first implementation may focus on post usage because posts are the only current shared-tag adopter.

### Resolve Actions

- **Approve**: set status to `ACTIVE`.
- **Mark needs-review**: set status to `NEEDS_REVIEW` for an existing tag.
- **Remove from selected posts**: delete selected `PostsToContentTags` assignments; do not delete the tag automatically.
- **Replace selected assignments**: assign another existing or newly created tag to selected posts, then remove the original selected assignments.
- **Merge tag**: move all assignments from source tag to target tag, dedupe conflicts, then remove or detach the source tag according to the chosen implementation boundary.

Sensitive actions should remain server-side and admin-gated. If app-styled confirmation dialogs are not available yet, this feature may use existing confirmation patterns and leave visual dialog polish to `admin-confirm-dialogs`.

## Risks / Trade-offs

- **Status name confusion**: choosing `NEEDS_REVIEW` keeps the public/private distinction clear.
- **Merge edge cases**: unique post/tag assignment keys require deduping when source and target are both attached to a post.
- **Scope creep**: keep this review-focused; broader tag metadata and cross-content management remain later work.
- **Existing public queries**: avoid adding status filters to shared tag includes.

## Migration Plan

1. Add the enum/field with `ACTIVE` default.
2. Regenerate Prisma client.
3. Add admin queries/actions for status and review operations.
4. Add the review UI.
5. Leave legacy `Post.tags` untouched until the follow-up migration feature.
