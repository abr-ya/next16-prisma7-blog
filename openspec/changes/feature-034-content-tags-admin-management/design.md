## Context

Shared content tags already exist for posts through `ContentTag` and `PostsToContentTags`. `/admin/content-tags` currently combines legacy post tag import with a review-focused cleanup panel for `NEEDS_REVIEW` tags. Existing actions can mark review status, remove selected post assignments, replace selected post assignments, and merge a tag into a target by name.

The new work should broaden that surface to all shared content tags while preserving the current post-only shared-tag adoption boundary. Video tags still use `VideoTag` and `VideosToVideoTags`.

## Goals / Non-Goals

**Goals:**

- Provide a content-wide admin management surface for shared `ContentTag` records.
- Show post usage in a way that supports rename, merge, status, selected detach, and unused delete decisions.
- Reuse the existing review actions where possible and extend them only where the broader management flow needs clearer semantics.
- Keep public blog tag behavior unchanged.

**Non-Goals:**

- No migration of video tags, docs, files, or other content types onto shared content tags.
- No public tag filtering changes.
- No new dependency or generated Prisma client edits.

## Decisions

1. Keep the existing Prisma schema for this slice.

   The required behavior can be represented by `ContentTag.status`, unique `ContentTag.slug`, and `PostsToContentTags`. Direct delete is allowed only when usage counts are zero, so no new archival state is needed.

   Alternative considered: add a soft-delete or alias table. That is heavier than the accepted feature because the current public surfaces resolve active assignments directly and merges already remove the source record.

2. Replace the review-only data shape with a management-oriented tag query.

   Add or extend a server data helper that returns all tags with counts and grouped usage. For this implementation, the only supported shared usage group is posts. The shape should be explicit enough to add videos/docs/files later without implying they are already migrated.

   Alternative considered: query needs-review and active tags separately in the page. A single management query keeps sorting, filtering, and empty states consistent.

3. Keep mutations server-only and admin-gated.

   All rename, merge, status, assignment removal, and unused delete actions should call `requireAdmin()` and revalidate `/admin/content-tags`, `/admin/posts`, `/blog`, and relevant blog tag/detail paths when feasible. Client components should only gather selections, open confirmation dialogs, and submit server actions.

   Alternative considered: add API routes. Server actions match the current admin tag workflow and avoid adding another mutation surface.

4. Treat rename and merge as separate workflows.

   Rename updates the current tag's name/slug only when the normalized slug is not owned by another tag. Merge moves assignments to an existing or created target tag, deduplicates assignments, then removes the source tag.

   Alternative considered: auto-merge on rename collision. Requiring explicit merge reduces accidental data loss when two labels normalize to the same slug.

5. Keep delete narrow: unused tags only.

   Deleting a used tag should fail with a message that points admins to selected assignment removal or merge. This preserves content relationships unless the admin chooses a targeted detach/merge workflow.

   Alternative considered: cascade delete used tags. Prisma would remove assignments through `onDelete: Cascade`, but that is too easy to trigger from a management table.

## Risks / Trade-offs

- Rename changes public blog tag URLs for posts using that tag -> mitigate by keeping slug conflict checks strict and making rename an explicit confirmation.
- A large tag with many posts could make the page heavy -> mitigate with compact usage display and consider pagination/search if the first implementation shows real scale pressure.
- Merge/delete operations are destructive to tag records or assignments -> mitigate with the existing app confirmation dialog pattern and server-side admin checks.
- Future content types may need different lifecycle rules -> mitigate by representing unsupported usage groups explicitly instead of pretending every content type is already backed by `ContentTag`.

## Migration Plan

No database migration is expected. Deploy the UI and server-action changes against the existing Prisma schema. Rollback is code-only: reverting the feature leaves existing `ContentTag` and `PostsToContentTags` data intact.
