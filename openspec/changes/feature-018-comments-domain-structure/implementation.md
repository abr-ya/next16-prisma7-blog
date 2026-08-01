## Implementation Notes

This change is implemented as a planning-only architecture slice. It does not change Prisma schema, migrations, runtime data helpers, routes, or UI behavior.

## Current Inventory

- Prisma currently has a generic `Comment` model with `id`, `content`, `createdAt`, optional `videoId`, required `userId`, and relations to `Video` and `User`.
- `User.comments` and `Video.comments` exist as relation fields. `Post` does not currently have a comment relation.
- `app/_data/video-comments.ts` is the current comment data boundary. It supports public video comment reads, authenticated creation, authenticated owner-only update/delete, content trimming, a 2000 character limit, public-video checks, and `/videos/:id` revalidation.
- `components/video-pages/video-comment-composer.tsx` is the current video comment UI boundary. It renders count, list items, author avatar/name, date, content, authenticated composer, and sign-in prompt.
- `app/comments/page.tsx` is a placeholder. It contains static copy, a placeholder comments array, `CommentForm`, and no real feed query or target contract.

## Final Planning Decisions

- `/comments` will become a unified comment feed with `All` and `Mine` modes, not a standalone guestbook or site-message page.
- Each comment will belong to exactly one supported target.
- The first implementation direction will use explicit nullable target relations such as `videoId`, `postId`, and later `mdDocId`, instead of a polymorphic `targetType`/`targetId` pair.
- Near-term targets are videos and posts. Markdown document comments remain deferred until a later feature promotes them.
- Replies/threading are deferred; the first shared structure remains flat.
- Ordinary authenticated users own their comments, admins may moderate comments across targets in future moderation features, and editor moderation remains deferred.

## Shared Comment List Item Contract

Future reusable comment UI should consume a normalized item shape:

```ts
type CommentListItem = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  target: {
    type: "video" | "post" | "mdDoc";
    title: string;
    href: string;
    preview?: string | null;
  };
};
```

Target-specific helpers should adapt raw video, post, and future markdown document comment records into this shape. The adapter owns target title, href, visibility filtering, and optional preview data.

## Follow-up Feature Slices

- Add schema/helper foundation for explicit post and future document targets, exact-one-target validation, and normalized comment helpers.
- Implement the public `/comments` unified feed with `All` and authenticated `Mine` views.
- Extract reusable comment list/composer UI after the normalized contract is proven.
- Add post comments as a dedicated feature.
- Keep link handling, own edit/delete controls, expiry rules, and moderation as separate follow-up features.
