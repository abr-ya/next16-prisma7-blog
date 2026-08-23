## Why

Visitors should see the same public navigation shell across the main public content routes, not only on the Blog and Videos route groups. This closes the gap left after the navbar link and localization slices by making Home, Docs, Docs detail, Comments, Blog, Blog detail, Videos, and Video detail share the same route coverage expectations.

## What Changes

- Mount or reuse the shared public navbar on the remaining primary public routes where it is currently absent, including `/`, `/docs`, `/docs/[slug]`, and `/comments`.
- Preserve existing navbar behavior on `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]`.
- Keep the navbar auth-aware: visitors keep the login entry point, signed-in users keep account access, and admin authorization remains server-side.
- Preserve the existing language switcher and localized navbar labels from the previous localization slice.
- Keep each public page's existing content and layout intent intact while adding a consistent shared public navigation boundary.

### Non-goals

- Do not change admin navigation, admin layout, or role authorization rules.
- Do not add a working public search experience; keep current search placeholder behavior.
- Do not localize page body content beyond the already-localized shared navbar labels.
- Do not change database models, Prisma schema, public content visibility rules, slugs, or route URLs.
- Do not redesign the public home, docs, comments, blog, or videos pages beyond the layout adjustments needed to host the shared navbar cleanly.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-navigation`: Add route coverage requirements for the shared public navbar across the primary public content surfaces.

## Impact

- Affected public routes: `/`, `/blog`, `/blog/[slug]`, `/docs`, `/docs/[slug]`, `/videos`, `/videos/[id]`, and `/comments`.
- Affected public surfaces: shared public navbar, public layout boundaries, home page, docs listing/detail pages, comments placeholder page, and existing blog/video public layouts.
- Affected code: likely `app/page.tsx`, `app/docs/page.tsx`, `app/docs/[slug]/page.tsx`, `app/comments/page.tsx`, relevant public layouts, and shared navbar/localization provider wiring as needed.
- Data models: no Prisma schema or data changes.
- Admin surfaces: no admin UI or authorization behavior changes.
- Dependencies: no new dependencies expected.
