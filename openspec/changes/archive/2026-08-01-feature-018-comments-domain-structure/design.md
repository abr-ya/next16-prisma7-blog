## Context

The project currently has a `Comment` Prisma model that is named generically but behaves as a video-comment model through the optional `videoId` relation. Public video comments are implemented in `app/_data/video-comments.ts` and rendered through `components/video-pages/video-comment-composer.tsx`. The public `/comments` page exists, but it is a placeholder with no real data contract.

The next comment expansion should not add isolated post comments, a standalone guestbook, or a separate comments page model without first defining the shared domain. This change is intentionally a planning slice: it defines the target structure and follow-up order before any Prisma migration or runtime behavior changes.

## Goals / Non-Goals

**Goals:**

- Define comments as a project-wide domain shared by videos, posts, and future docs.
- Define `/comments` as a unified comments feed with `All` and authenticated `Mine` views.
- Define the first reusable comment list item contract for shared UI.
- Decide how comments link back to their target pages.
- Define ownership, visibility, and moderation boundaries.
- Split implementation into small follow-up slices.

**Non-Goals:**

- No Prisma migration in this planning slice.
- No implementation of post comments.
- No implementation of the `/comments` feed.
- No refactor of current video comment UI or helpers.
- No comment replies/threading implementation.
- No standalone guestbook or site-message model.

## Decisions

### Decision: Use explicit target relations

Future comment storage should continue from the existing `Comment` model and add explicit nullable relations for supported targets, such as `videoId`, `postId`, and later `mdDocId`. The system should enforce that each comment belongs to exactly one target.

Alternative considered: use polymorphic `targetType` and `targetId` fields. That is compact and flexible, but weaker in Prisma because it loses native relations, referential integrity, and straightforward target-specific queries.

### Decision: Treat `/comments` as a unified comments feed

`/comments` should not be a standalone guestbook. It should show recent comments across accessible content and provide at least two modes:

- `All`: recent comments on public targets.
- `Mine`: comments authored by the current authenticated user.

Each comment item should link back to the target page, such as `/videos/:id` or `/blog/:slug`.

Alternative considered: make `/comments` a separate site-message page. That would be simpler, but it would not help users navigate ongoing conversations around videos, posts, and docs.

### Decision: Define a reusable comment list item contract

Future shared comment UI should consume a normalized list item shape rather than raw Prisma records. The first target contract should include:

- comment id
- plain-text content
- creation timestamp
- author id, display name, and avatar/fallback state
- target type
- target title
- target href
- optional target preview

Target-specific helpers can adapt video, post, and future doc comments into this shared shape.

Alternative considered: let each content type render its own bespoke comment item. That avoids an adapter layer, but duplicates list, empty state, author, target, and navigation UI.

### Decision: Keep the first structure flat

The first shared comment structure should stay flat. Replies/threading can be planned later with `parentId`, but it should not be part of the first implementation slices.

Alternative considered: add `parentId` immediately. That anticipates future discussion depth, but it increases query, moderation, and UI complexity before the cross-target foundation exists.

### Decision: Reuse role boundaries from the auth role foundation

Ordinary authenticated users should create and manage their own comments according to per-feature rules. `admin` should be able to moderate comments across targets in future admin features. The planned `editor` role may later moderate content comments without system settings access, but `editor` should remain deferred.

Alternative considered: keep moderation ownership-only until a later redesign. That blocks useful admin moderation workflows now that role storage exists.

### Decision: Split implementation follow-ups

This planning slice should produce follow-up features instead of bundling all comment work together. The expected follow-ups are:

1. Comment schema/helper foundation for explicit post/doc target relations and normalized list item helpers.
2. Public `/comments` unified feed with `All` and `Mine`.
3. Reusable comment UI extraction from the video comment UI.
4. Post comments.
5. Comment link handling.
6. Own edit/delete controls and expiry rules.
7. Admin/editor moderation views.

Alternative considered: implement schema, feed, post comments, and reusable UI together. That would be too broad and risky because it touches data model, public navigation, existing video behavior, and future moderation at once.

## Risks / Trade-offs

- Multiple nullable target relations can allow invalid rows unless enforced -> add database or application validation in the implementation slice so exactly one target is present.
- Unified feed can expose private target comments if visibility joins are wrong -> require target-aware visibility filters for each target type.
- Shared UI can become too generic -> normalize only the list/feed contract first and keep target-specific composition in adapters.
- Existing video comments should not regress -> keep video behavior unchanged until a dedicated migration/helper slice.
- `/comments` `Mine` view requires auth-aware data loading -> make anonymous behavior explicit before implementation.

## Migration Plan

1. Accept this planning slice without changing runtime behavior.
2. Follow up with a schema/helper foundation slice for explicit target relations and normalized list item helpers.
3. Follow up with `/comments` unified feed once target adapters exist.
4. Follow up with reusable UI extraction after the feed/list contract is proven.

Rollback for this planning slice is documentation-only. Runtime rollback applies only to later implementation slices.

## Open Questions

None for this planning slice.
