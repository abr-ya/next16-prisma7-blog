# Design

## Context

`PublicNavbarShell` (`components/layout/public-navbar-shell.tsx`) is the reusable server-side public navbar wrapper, mounted today by `app/(site-top-nav)/layout.tsx` and applied to docs, hikes, tracks, profile, and trips. Four primary public route families are not covered by it: `/` renders nothing but its own `<main>`, `/comments` renders nothing but a `PageLayout` (which itself renders a legacy `← Back to Home` link), and `/blog` and `/videos` ship nearly-identical `layout.tsx` files that re-implement the same `<Navbar>` + `authSession()` wrapper using a barrel-imported `Navbar`. The shell's existing behavior is correct; the rollout only moves routes into the group, renames the group for accuracy, deletes the duplicate layouts, and removes the dead back-link affordance.

## Goals / Non-Goals

**Goals:**

- Relocate four route families under the shared shell without changing URLs, content, or auth/visibility rules.
- Eliminate the two duplicate `app/blog/layout.tsx` and `app/videos/layout.tsx` files so the shell is the single source of truth for public-surface chrome.
- Rename the route group to `(public)` so the group's name reads as "default public surface" rather than "a special opt-in top-nav overlay".
- Remove the dead `showBackLink` affordance from `PageLayout` and clean up the seven existing call sites.

**Non-Goals:**

- Multi-root-layouts (the navbar does not move into `app/layout.tsx`; the project keeps a single root layout).
- Content, behavior, or copy changes on any moved route.
- `Navbar` itself, language switcher, or styling changes.
- `PageLayout` removal — it remains the `<main>` content shell for all public pages that need it.
- Auth/visibility/data-model changes.

## Decisions

### Decision: Keep the single root layout and use a nested route group for the public shell

We use Next.js's URL-neutral route-group pattern (`app/(public)/layout.tsx`) instead of Next.js's multiple-root-layouts pattern. The shell stays one level below the root, so the existing `app/layout.tsx` (with i18n `I18nProvider`, geist fonts, `Toaster`, `globals.css`, `leaflet.css`) remains the single source of truth for global setup, and admin/auth continue to live outside the group as today.

**Alternatives considered:**

- *Move `PublicNavbarShell` into `app/layout.tsx` and use multiple-root-layouts for admin/auth to opt out.* Cleaner "default public surface" semantics, but forces duplicating `<html>`, `<body>`, `I18nProvider`, `initServerI18next`, geist fonts, and `Toaster` across three root layouts. Cost is high for no behavioral gain.
- *Add admin/auth to a `(no-public-navbar)` route group at the same level as `(public)` and have it re-implement minimal root-equivalents.* Same duplication cost as above for the same gain.

### Decision: Rename `(site-top-nav)` to `(public)` rather than keep the existing name

The new name matches the "default public surface" mental model; the existing name reads as "a special top-nav overlay". Route group names are URL-neutral so this rename is purely ergonomic.

**Alternatives considered:**

- *Keep `(site-top-nav)`.* Zero rename cost, but the cognitive mismatch persists.
- *Drop the group and put the navbar directly in `app/layout.tsx`* — see above; rejected.

### Decision: Drop the `showBackLink` prop and JSX from `PageLayout`, do not delete `PageLayout`

The seven existing call sites already pass `showBackLink={false}`; zero callers want the default "← Back to Home". Removing the prop is a strict simplification. `PageLayout` itself stays because it provides a `<main>` shell, content-width container, and header/header-action slot that all public pages still use.

**Alternatives considered:**

- *Keep `showBackLink` and pass `false` explicitly on `/comments`.* Smaller diff but prop becomes a no-op maintained for callers that already disable it.
- *Inline `<main>` in the seven call sites and delete `PageLayout`.* Spreads the `<main>` shell across seven files; the page-layout file is then more duplication, not less.

### Decision: Move files via `git mv` and run validation per moved file family

Use `git mv` for all six page moves and the directory rename so git history follows them. Validate incrementally per file family (home, then comments, then blog, then videos) so a regression in one route is caught before the next is migrated.

**Alternatives considered:**

- *Single big-bang move followed by a single validation pass.* Faster but a regression in one moved route forces bisecting the whole batch.

## Risks / Trade-offs

- **`git mv` history merge noise.** The `(site-top-nav)` → `(public)` rename plus six page moves creates several rename entries in PRs. → Mitigation: rename the directory in one commit before moving pages, so each page move shows as a directory-relative rename rather than a path-jumping rename.
- *Partial migration leaves admin or admin-style subroutes exposed to the new layout.* `app/blog/links` and `app/videos/...` admin subdirectories must not be touched. → Mitigation: explicit whitelist of moved files; admin/admin-style subdirs left in place. `git grep` per move step to confirm scope.
- *`PageLayout` callers hand-written with `<Button>`/`<ArrowLeft>` somewhere we have not grep'd.* → Mitigation: before removing `showBackLink`, ripgrep the full repo for `showBackLink`, `Back to Home`, and `ArrowLeft` from `app/` and `components/`. If any caller outside `components/layout/page-layout.tsx` references these, address them in the same diff.
- *Cached dev-server modules hold the old layout path in memory after the rename.* → Mitigation: validation step requires `npm run build` (production compile) rather than only the dev server; the user already runs a clean rebuild from time to time during feature work.
- *Inventory document drifts from actual route group membership.* → Mitigation: `docs/public-navigation-route-coverage.md` is updated in the same change as the four moved routes; future additions/removals keep the inventory and the route group membership in lockstep.

## Migration Plan

1. Rename `app/(site-top-nav)` to `app/(public)` in one commit (no content change, just the directory rename). Run `npm run tsc` to confirm zero errors.
2. Move `app/page.tsx` → `app/(public)/page.tsx` via `git mv`. Run `npm run tsc`. Manually smoke `/` to confirm the navbar is now rendered.
3. Move `app/comments/page.tsx` → `app/(public)/comments/page.tsx` and switch its body from `PageLayout`-with-default-showBackLink to a clean `PageLayout` call (no `showBackLink`). Run `npm run tsc` and smoke `/comments`.
4. Move `app/blog/{page.tsx,[slug]/page.tsx}` → `app/(public)/blog/...` and delete `app/blog/layout.tsx`. Run `npm run tsc` and smoke `/blog` and one `/blog/[slug]`.
5. Move `app/videos/{page.tsx,[id]/page.tsx}` → `app/(public)/videos/...` and delete `app/videos/layout.tsx`. Run `npm run tsc` and smoke `/videos` and one `/videos/[id]`.
6. Remove `showBackLink` from `components/layout/page-layout.tsx` and clean up the seven call sites. Run `npm run tsc`, then targeted ESLint over the seven callers.
7. Run `npm run build`. Confirm `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments`, `/admin`, `/sign-in`, and one already-covered route (e.g., `/docs`) all appear in the route list.
8. Update `docs/public-navigation-route-coverage.md` to mark the four route families `Covered by shared public shell`.
9. Manual browser smoke on the routes listed in scenario 1 of the new requirement.
10. Archive the change.

**Rollback strategy:** Each of the seven migration steps above is independently reversible (revert the moves, restore the deleted `layout.tsx` files from the previous commit, restore `showBackLink` in `PageLayout`, revert the inventory edit). The route group rename is also reversible in one step.

## Open Questions

None material; design and specs are settled and tasks remain small reviewable steps.
