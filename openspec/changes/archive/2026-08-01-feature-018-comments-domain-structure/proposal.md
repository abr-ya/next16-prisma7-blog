## Why

Comments should become a project-wide navigation and discussion layer, not a video-only feature. This planning change defines a shared comment domain so video comments, future post comments, and the public `/comments` feed can use one model and reusable UI contracts.

## What Changes

- Define `/comments` as a unified comments feed showing recent comments across public content, with `All` and authenticated `Mine` views.
- Define a shared comment target model where each comment belongs to exactly one supported target.
- Prefer explicit nullable Prisma relations such as `videoId`, `postId`, and future `mdDocId` over a polymorphic `targetType`/`targetId` schema.
- Define a reusable `CommentListItem` contract with author, content, timestamp, target type, target title, target href, and optional target preview.
- Identify which parts of the current video comment helpers and UI can be generalized later.
- Define auth and moderation boundaries for ordinary users, `admin`, and future `editor`.
- Split implementation into follow-up slices for schema/helper foundation, `/comments` feed, reusable UI extraction, post comments, link handling, own comment controls, expiry rules, and moderation.

Non-goals:

- No Prisma migration in this planning slice.
- No runtime change to current video comment behavior.
- No `/comments` feed implementation in this slice.
- No post comments implementation in this slice.
- No reusable UI extraction in this slice.
- No comment threading/replies implementation in this slice.
- No standalone guestbook/site-message feature in this slice.

## Capabilities

### New Capabilities

- `comments-domain-structure`: Defines the project-wide comment target model, unified comments feed behavior, reusable comment UI contract, moderation boundaries, and follow-up implementation slices.

### Modified Capabilities

- `video-comments`: Clarifies how existing video comments fit into the future project-wide comments domain without changing current video comment behavior in this slice.

## Impact

- Affects future work around `prisma/schema.prisma`, `app/_data/video-comments.ts`, future shared comment helpers, `components/video-pages/video-comment-composer.tsx`, future `components/comments-*`, `app/comments/page.tsx`, public video/post/doc pages, and admin moderation surfaces.
- Establishes that `/comments` should link each comment back to its target page, such as `/videos/:id` or `/blog/:slug`.
- Provides planning dependencies for `feature-021-comment-link-handling-structure`, `feature-026-video-comments-edit-delete-expiry`, and `feature-031-video-comments-own-management`.
