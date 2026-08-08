## Why

Posts still store tags as a free-form `Post.tags String[]`, so every edit writes raw strings and never creates reusable shared tag records. Feature-019 accepted the content-tag architecture; this slice is the first runtime step so new and edited post tags use shared `ContentTag` records and typed post assignments while old string values stay readable until the planned legacy migration (`feature-030`).

## What Changes

- Add Prisma models for shared content tags and typed post-to-tag assignments (`ContentTag`, `PostsToContentTags`).
- Add post-focused content-tag helpers (normalize / slug) aligned with the proven video-tag rules.
- Change admin post create/update so selected tags resolve into shared tag records and assignment rows.
- Change post reads used by admin edit and public blog surfaces so display prefers shared assignments, then falls back to legacy `Post.tags`.
- Keep writing or preserving legacy `Post.tags` compatibility so unmigrated string values remain identifyable until `feature-030`.
- Prefer shared tag display names/slugs on public badges once assignments exist.

### Non-goals

- No bulk migration of existing `Post.tags` values into `ContentTag` (that is `feature-030`).
- No content-wide admin tag manager, rename/merge/delete tools (`feature-031`).
- No change to `VideoTag` / video admin or public video tag behavior.
- No public tag filtering or tag listing pages beyond existing badge links that already use tag labels.
- No polymorphic assignment table and no shared extraction force on `lib/video-tags.ts` beyond matching rules.

## Capabilities

### New Capabilities

- `content-tags-post-adoption`: Runtime rules for shared content tags on posts—assignment storage, admin read/write through shared tags, dual-read display with legacy `Post.tags` fallback, and boundaries for later migration/management slices.

### Modified Capabilities

- `content-tags`: Turn post-adoption scenarios from "future slice" into implemented runtime requirements and point remaining work to migration/admin features.
- `blog-post-detail`: Public detail tags may come from shared assignments (with legacy fallback) instead of only `Post.tags`.

## Impact

- **Schema**: `prisma/schema.prisma` + migration for `ContentTag` and `PostsToContentTags`; keep `Post.tags String[]`.
- **Data helpers**: `app/_data/posts.ts` create/update/read paths; new content-tag helper(s) under `lib/`.
- **Admin UI**: `/admin` post create/edit form values (`components/admin-pages/post-form.tsx`, `app/admin/posts/[id]/page.tsx`) load option/assignment shapes from shared tags.
- **Public UI**: Blog listing/detail tag badges (`components/blog-pages/*`, blog post detail route) via post query projection.
- **Unchanged**: Video tags, comments, files, docs unless shared accidental imports.
- **Follow-ups**: `feature-030-content-tags-legacy-post-migration`, `feature-031-content-tags-admin-management`.
