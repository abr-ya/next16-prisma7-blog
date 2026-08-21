## Why

The public home page should act as a clear content hub for visitors, pointing first to the site's main public sections instead of separating links into stale "new" and "old" labels. This makes the landing page match the current meaning of the site: blog posts, saved video links, markdown documents, and comments as content areas.

## What Changes

- Replace the current home hero link groups with a prioritized content hub surface:
  - Blog
  - Video Links
  - Markdown Documents
  - Comments
- Present the primary public sections as small linked cards or card-like buttons with short English descriptions.
- Mark the Comments section honestly as work in progress while its standalone `/comments` page is still placeholder-level.
- Keep an admin dashboard entry point on the home page, but make it visually secondary to the public content links.
- Remove stale copy that frames parts of the site as old/new versions.
- Add backlog candidates for public localization and the standalone comments feed follow-up.

Non-goals:

- Do not implement localization in this change.
- Do not implement the standalone `/comments` unified feed in this change.
- Do not change authentication, role checks, admin authorization, or data models.
- Do not change the shared public navbar behavior beyond any small styling consistency needed for the home page.

## Capabilities

### New Capabilities

- `public-home-page`: Defines the public home page as a content hub with prioritized links, descriptions, a work-in-progress comments state, and a secondary admin entry point.

### Modified Capabilities

- None.

## Impact

- Affected routes: `/`.
- Affected public surfaces: home page hero/content section links.
- Affected admin surfaces: only the public home page's secondary link to `/admin`; admin pages and authorization remain unchanged.
- Affected data models/APIs: none.
- Dependencies: none.
