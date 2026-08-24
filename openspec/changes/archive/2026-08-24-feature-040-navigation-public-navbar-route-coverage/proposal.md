## Why

Visitors should eventually see the same public navigation shell across the main public content routes, not only on the Blog and Videos route groups. This first slice prepares that rollout by documenting public route coverage, adding a reusable shared navbar shell, and proving it on the Docs route family before broadening the behavior surface.

## What Changes

- Add a public navigation route coverage inventory document that lists primary public routes, current navbar coverage, intended coverage, and excluded route families.
- Add or adapt a reusable shared public navbar shell that owns the server-side session lookup and passes auth-aware props to the existing navbar.
- Mount the shared public navbar shell on `/docs` and `/docs/[slug]` as the pilot route family.
- Preserve existing navbar behavior on `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]` without requiring those route families to move to the new shell in this slice.
- Leave `/` and `/comments` for a follow-up rollout after the docs pilot validates the shared shell pattern.
- Keep the navbar auth-aware: visitors keep the login entry point, signed-in users keep account access, and admin authorization remains server-side.
- Preserve the existing language switcher and localized navbar labels from the previous localization slice.
- Keep Docs listing/detail content, metadata, visibility behavior, slugs, and route URLs intact while adding the shared navbar.

### Non-goals

- Do not change admin navigation, admin layout, or role authorization rules.
- Do not add a working public search experience; keep current search placeholder behavior.
- Do not localize page body content beyond the already-localized shared navbar labels.
- Do not change database models, Prisma schema, public content visibility rules, slugs, or route URLs.
- Do not complete full public route coverage in this slice; Home, Comments, and any cleanup of Blog/Videos layouts belong to a follow-up rollout.
- Do not redesign the public home, docs, comments, blog, or videos pages beyond the layout adjustments needed for the Docs pilot.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-navigation`: Add route coverage preparation requirements, a reusable shared public navbar shell, and pilot coverage for the Docs route family.

## Impact

- Affected public routes in this slice: `/docs` and `/docs/[slug]`.
- Affected public routes documented for follow-up: `/`, `/comments`, `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]`.
- Affected public surfaces: public navigation route coverage documentation, shared public navbar shell, Docs listing/detail pages, and existing blog/video public layouts only as reference points.
- Affected code: likely a new or adjusted shared public navbar shell/wrapper, `app/docs/page.tsx`, `app/docs/[slug]/page.tsx`, and shared navbar/localization provider wiring as needed.
- Data models: no Prisma schema or data changes.
- Admin surfaces: no admin UI or authorization behavior changes.
- Dependencies: no new dependencies expected.
