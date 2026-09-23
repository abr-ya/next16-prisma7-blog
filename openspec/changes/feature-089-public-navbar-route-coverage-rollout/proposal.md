# Proposal

## Why

The shared public top-nav shell shipped behind `app/(site-top-nav)/layout.tsx` (feature-066) as a docs pilot, then expanded into the rest of `app/(site-top-nav)/` (docs, hikes, tracks, profile, trips). Four remaining primary public route families — `/`, `/blog`, `/videos`, `/comments` — still own their own navbar wrappers: `/` and `/comments` render no top-nav at all, and `/blog` and `/videos` each ship a duplicate `layout.tsx` that re-implements the same `Navbar` + `authSession()` pattern with a barrel-imported `Navbar` instead of the reusable shell. The result is three copies of one chrome component, two of which are not even using the shared shell.

The `public-navbar-route-coverage-rollout` row in `openspec/backlog.md` already names this slice as the planned follow-up after the docs pilot, and `docs/public-navigation-route-coverage.md` records the deferral explicitly. This change completes that rollout: move the four remaining route families under the shared shell, rename the route group from `(site-top-nav)` to `(public)` so it reads as the default public surface instead of an opt-in overlay, delete the two duplicate `app/blog/layout.tsx` and `app/videos/layout.tsx` files, and drop the unused `showBackLink` "← Back to Home" affordance from `PageLayout` (zero callers still want it).

## What Changes

- **Move `app/page.tsx` → `app/(public)/page.tsx`**. URL `/` is preserved; the page now inherits the shared public navbar from the renamed route group's layout.
- **Move `app/comments/page.tsx` → `app/(public)/comments/page.tsx`** and switch it from `PageLayout` (which currently renders its own "← Back to Home") to a clean `PageLayout` call with `showBackLink` removed; the page now inherits the shared navbar from the group.
- **Move `app/blog/page.tsx` + `app/blog/[slug]/page.tsx` → `app/(public)/blog/...`** and delete `app/blog/layout.tsx`. The remaining `app/blog/links` admin-style subdirectory stays where it is (it lives outside the public routing tree and uses the admin shell, not the navbar layout).
- **Move `app/videos/page.tsx` + `app/videos/[id]/page.tsx` → `app/(public)/videos/...`** and delete `app/videos/layout.tsx`. The `app/videos/...` admin subdirectory stays.
- **Rename `app/(site-top-nav)` → `app/(public)`**. Next.js URL-neutral route groups do not change URLs; the rename is purely to make the group's intent ("the default public surface") match its name. This affects the layout file path and the `app/(public)/<...>` routes already present (docs, hikes, tracks, profile, trips).
- **Drop the legacy `showBackLink` affordance from `PageLayout`**: remove the `showBackLink?: boolean` prop, the `<Button>`/`<ArrowLeft>` JSX, and the early-return branch. Update the seven existing call sites that pass `showBackLink={false}` so they no longer reference the removed prop.
- **Update `docs/public-navigation-route-coverage.md`** so the four route families move from `Existing layout preserved`/`Not covered` to `Covered by shared public shell`.

No public URL changes. No auth or visibility rule changes. No data model or migration changes. No new dependencies.

### Non-goals

- Changing `PublicNavbarShell`'s implementation or its `Navbar` contents — the shell already does the right thing; we are only extending coverage.
- Touching `/admin/*`, `/(auth)/sign-in`, `/(auth)/sign-up`, `/files/*`, `/api/*`, or any framework/static route — those remain outside the public shell exactly as they are today.
- Touching content behavior on any of the four moved routes — only chrome (navbar presence, back-link removal) changes.
- Removing `PageLayout` itself — the `<main>` + content-width container remains in use by all public pages already under the shell.
- Refactoring `Navbar` itself, changing language switcher behavior, or restyling the navbar.
- Hard-coding top-nav coverage at the root layout via multi-root-layouts — the project keeps the single root layout (`app/layout.tsx`) and the shared shell as a nested group layout. The "default public surface" model is achieved by route-group membership, not by structural enforcement.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-navigation`: the `Public navbar route coverage is inventoried before rollout` requirement and the `Docs routes pilot the shared public navbar shell` requirement need updating now that the broad rollout is happening. The contract becomes "all primary public route families listed in the inventory are covered by the shared shell", not "Docs is the pilot and the rest is deferred". The route coverage inventory document is updated in lockstep. A delta spec file is written at `openspec/changes/feature-089-public-navbar-route-coverage-rollout/specs/public-navigation/spec.md`.

## Impact

- **Affected routes**: `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments`. URLs are preserved in all six; only their parent layout chain and the navbar's presence change.
- **Affected layout files**:
  - New: `app/(public)/layout.tsx` (renamed from `app/(site-top-nav)/layout.tsx`, content unchanged).
  - Deleted: `app/blog/layout.tsx`, `app/videos/layout.tsx`, `app/(site-top-nav)/layout.tsx` (after rename).
- **Affected page files**: `app/(public)/page.tsx` (moved), `app/(public)/comments/page.tsx` (moved + body trimmed), `app/(public)/blog/page.tsx` (moved), `app/(public)/blog/[slug]/page.tsx` (moved), `app/(public)/videos/page.tsx` (moved), `app/(public)/videos/[id]/page.tsx` (moved).
- **Affected component**: `components/layout/page-layout.tsx` (drop `showBackLink` prop and JSX).
- **Affected call sites of `PageLayout`**: seven existing routes under `(public)` that currently pass `showBackLink={false}` — clean the prop out of each after the component change.
- **Affected docs**: `docs/public-navigation-route-coverage.md` (move four rows to "Covered").
- **Affected specs**: `openspec/specs/public-navigation/spec.md` receives a delta via the change's spec delta file.
- **Affected data**: none. No Prisma schema change, no migration, no new models, no new indexes.
- **Affected auth/visibility**: none. Shell already renders the auth-aware `Navbar` with the same `authSession()` shape.
- **Validation**: `npm run tsc`, targeted ESLint over the moved files, `npm run build` for the affected routes.
- **Manual browser smoke**: visit `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments` and confirm each renders the shared navbar and no "← Back to Home" link. Visit `/admin`, `/sign-in` and confirm they remain navbar-free. Visit one already-covered public route (`/docs`, `/hikes`) and confirm nothing regressed.
