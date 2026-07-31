## Context

Public video detail pages already fetch comments through `getPublicVideoComments(video.id)`, but the UI only uses that data to initialize the comment count in `VideoCommentComposer`. The existing `Comment` model already stores plain-text content, creation time, video ownership through `videoId`, and related user name/image data needed for read-only rendering.

## Goals / Non-Goals

**Goals:**

- Render the existing public video comments on `/videos/{id}`.
- Show comment content, creation date, user display name, and user avatar or a compact fallback.
- Preserve the existing signed-in comment creation workflow and anonymous sign-in prompt.
- Keep comments scoped to public videos through the existing server helper.

**Non-Goals:**

- Add edit/delete UI.
- Add the 24-hour edit/delete rule.
- Change the Prisma schema or create a new comment model.
- Add threaded replies, reactions, moderation, notifications, or comment search.
- Implement the standalone `/comments` page or post comments.

## Decisions

- Keep reads server-side in the video detail page and pass the initial comment list into the comment UI.
  - Rationale: the current route already fetches public comments on the server, and this avoids adding an API route or client-side fetch just to render the initial list.
  - Alternative considered: fetch comments from the client after mount. That would add loading states and an extra public endpoint without improving the first slice.

- Extend the existing video comment UI rather than adding a separate page section.
  - Rationale: the count, composer, sign-in prompt, empty state, and list are one comment section from the user's point of view.
  - Alternative considered: create a separate `VideoCommentList` next to `VideoCommentComposer` in the page. That is still possible as an internal extraction, but the visible section should remain cohesive.

- Use the existing selected user fields for author display.
  - Rationale: `getPublicVideoComments` already selects `user.name` and `user.image`; no schema or query expansion is needed.
  - Alternative considered: add more profile metadata. That would expand the surface area beyond the requested text/date/avatar/name list.

## Risks / Trade-offs

- Newly created comments may require a route refresh before they appear in the list if the composer keeps only a local count update. → Refresh the route after creation, and keep count/list state consistent in the component implementation.
- Long comment text can distort the compact detail layout. → Render comments with wrapping and bounded spacing inside the existing section width.
- Missing user images can produce broken visual states. → Render a deterministic fallback using the user's display name or a generic avatar state.
- This exposes existing public-video comments more visibly. → Continue relying on `getPublicVideoComments` public-video visibility filtering and avoid adding new public comment access paths.
