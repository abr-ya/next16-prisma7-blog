## Why

Content tags need one project-wide architecture before tags expand beyond the proven video workflow. The outcome is a clear shared tag contract for posts, videos, and future content types so later implementation slices can reuse the same naming, normalization, ownership, visibility, and migration rules instead of growing separate tag systems.

## What Changes

- Define a new `content-tags` capability that describes shared tag concepts across content types.
- Document how the existing video tag workflow informs the shared architecture without forcing an immediate video implementation rewrite.
- Define how current `Post.tags String[]` data should be treated as legacy-compatible data until a later controlled review and migration slice handles old tag values.
- Establish tag normalization, slug uniqueness, content assignment ownership, public visibility, and admin/public display boundaries.
- Split concrete implementation work into later follow-up features, including post adoption of shared tags, controlled legacy post tag review/migration, public filtering, and dedicated admin tag management.

### Non-goals

- Do not implement Prisma schema changes in this feature.
- Do not migrate existing `Post.tags` values in this feature; plan legacy post tag review and transfer as a separate controlled migration feature.
- Do not replace existing `VideoTag` records or `VideosToVideoTags` assignments in this feature.
- Do not add public tag filtering, tag landing pages, tag search, colors, aliases, merge/delete workflows, or a dedicated admin tag manager in this feature.
- Do not change current public video tag badge behavior or current post form behavior in this feature.

## Capabilities

### New Capabilities

- `content-tags`: Defines the project-wide tag domain architecture for posts, videos, docs, files, and future content surfaces.

### Modified Capabilities

- `video-library`: Clarifies that existing video tags remain the proven first implementation and future shared-tag adoption must preserve current video tag behavior.

## Impact

- Affected data models: `Post.tags`, `VideoTag`, `VideosToVideoTags`, and future shared tag/assignment models.
- Affected admin surfaces: current post and video edit forms, future shared tag selectors, and future content-wide admin tag management.
- Affected public surfaces: current passive video tag badges, current blog post tag display, and future tag filters or tag landing pages.
- Affected helpers: `lib/video-tags.ts` and future shared tag normalization/assignment helpers under `lib` or `app/_data`.
- No runtime code, migration, dependency, or route behavior changes are expected in this architecture-only feature.
