## Context

The accepted comments-domain structure defines a normalized `CommentListItem` with comment fields, author fields, and target fields. Current runtime video comments are still represented by `PublicVideoComment` records from `app/_data/video-comments.ts`, and `components/video-pages/video-comment-composer.tsx` defines a local `VideoCommentListItem` shape for display. The current `Comment` Prisma model only has a nullable `videoId`, so this feature should adapt existing video comments without changing the database model.

## Goals / Non-Goals

**Goals:**

- Introduce a shared runtime comment list item contract for comment UI consumers.
- Add a video comment adapter that maps existing public video comment records to the shared item contract.
- Keep the public video detail page visually and behaviorally unchanged.
- Preserve existing public video visibility checks, comment ordering, creation flow, safe link rendering, and authenticated access behavior.

**Non-Goals:**

- No Prisma schema changes or migrations.
- No `/comments` unified feed implementation.
- No post or markdown document comments.
- No edit/delete UI, expiry rules, moderation tools, or admin workflows.
- No change to the safe comment link parsing policy.

## Decisions

### Use A Shared Runtime Contract

Add a reusable TypeScript contract for shared comment list items, for example in `lib/comments.ts` or another small shared module. The contract should include:

- `id`, `content`, and serialized `createdAt`.
- `author` fields with id, display name, and optional image.
- `target` fields with type, title, href, and optional preview.

The UI-facing contract should use a serialized date string so it can cross from server data helpers/pages into client components without each consumer defining its own date conversion type.

### Keep Video Comment Reads Authoritative

`app/_data/video-comments.ts` should remain the authoritative place for public video comment reads and mutations in this slice. It should either export a normalizer or return an additional helper result for shared list items, but it should not weaken the existing public video visibility filter or mutation ownership checks.

### Include Target Metadata Without Changing Visibility

The video adapter should include enough video target metadata to create a target link back to `/videos/{id}` and display the target title in future shared UI. If target preview data is cheap and already available in the selected public video relation, it may include thumbnail data; otherwise preview can remain `null` or omitted according to the contract.

### Preserve Current Video UI

`components/video-pages/video-comment-composer.tsx` should consume the shared item shape for `initialComments`, while keeping the rendered author, date, count, empty state, safe `CommentText`, sign-in prompt, and creation form behavior unchanged. The component should not start rendering target metadata on the video detail page, because the target is already implied by the page.

## Risks / Trade-offs

- Adding target metadata can increase query shape complexity. Mitigation: select only minimal public video fields needed by the contract.
- A shared contract can become too broad too early. Mitigation: include only fields accepted in `comments-domain-structure` and needed for future shared list rendering.
- Refactoring UI props can accidentally change display behavior. Mitigation: keep rendering assertions/manual browser checks focused on current public video comment scenarios.

## Migration Plan

No data migration is required. Rollback is limited to restoring the video-specific UI item shape and removing the shared adapter.
