# Proposal

## Why

Public video comments already have a proven interface, but its client component is coupled to the video target and cannot be reused for the planned photo comments or the later `/comments` feed. Extracting a target-neutral UI foundation now keeps subsequent comment features small and visually consistent while preserving established video behavior.

## What Changes

- Extract reusable client-side building blocks for the public comment list, author/date/content presentation, empty state, authenticated comment composer, and optional own-comment mutation controls.
- Refactor the public video detail page to use those building blocks through video-specific callbacks and labels without changing video comment reads, mutations, visibility, ordering, count behavior, or safe-link rendering.
- Define the client-facing adapter boundary so later targets supply their own server actions and target context instead of sharing or polymorphically merging target data access.

## Capabilities

### New Capabilities

None. This is a behavior-preserving UI refactor; `skip_specs: true` is set in the change configuration.

### Modified Capabilities

None. Public video comment requirements remain unchanged.

## Impact

- Affected public route: `/videos/[id]`.
- Affected client components: `components/video-pages/video-comment-composer.tsx`, new shared comment UI modules, and existing safe comment-text rendering.
- Affected data/API boundary: the existing `app/_data/video-comments.ts` server actions are retained behind target-specific callbacks.
- No Prisma schema, migration, authentication policy, dependency, or administrator surface changes.

## Non-Goals

- Adding photo comments, post comments, a unified `/comments` feed, moderation, or comment expiry rules.
- Changing video comment ownership or visibility rules.
- Replacing target-specific server data helpers with a cross-target database query layer.
