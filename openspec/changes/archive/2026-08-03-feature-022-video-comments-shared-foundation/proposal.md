## Why

Existing public video comments already provide the first real comment target in the project, but their read shape and UI-facing list item shape are still video-specific. Before implementing `/comments`, post comments, or cross-target comment UI, video comments should expose a reusable shared comment item contract while preserving the current public video behavior.

## What Changes

- Define a shared comment list item contract for runtime code that matches the accepted comments-domain structure.
- Add a video comment normalizer/adapter that maps existing video comment records into that shared contract.
- Keep current public video comment reads, creation, list rendering, comment counts, safe link rendering, and ownership behavior unchanged.
- Update public video detail comment data flow to consume the shared item shape where it crosses into UI.
- Keep this as a compatibility foundation without introducing post comments, `/comments` feed behavior, edit/delete UI, moderation, or schema changes.

### Non-goals

- Do not add a `/comments` unified feed implementation in this feature.
- Do not add post comments or markdown document comments in this feature.
- Do not change the Prisma `Comment` model, add migrations, or add target relations beyond the current video comment data.
- Do not change public video comment creation, ownership, safe link rendering, ordering, or visibility behavior.
- Do not add own-comment edit/delete controls, 24-hour expiry rules, admin moderation, or role-specific moderation behavior.
- Do not add new dependencies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `comments-domain-structure`: Moves the previously accepted shared comment list item contract from planning-only toward an implementation-ready runtime contract.
- `video-comments`: Adapts existing public video comments to the shared comment list item contract while preserving current behavior.

## Impact

- Affected data helpers: `app/_data/video-comments.ts` and any new shared comment helper/type module.
- Affected UI: `components/video-pages/video-comment-composer.tsx` should continue to render the same public video comment list and creation form.
- Affected route: `/videos/{id}` public detail page data mapping may move to the shared comment item shape.
- No schema, migration, route contract, dependency, or visible behavior changes are expected.
