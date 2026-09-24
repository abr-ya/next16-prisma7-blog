# Tasks

## 1. Rename the public shell route group

- [x] 1.1 Rename `app/(site-top-nav)` to `app/(public)` via `git mv` (single commit, no content change yet); verify `ls "app/(public)"` shows the same children the old path had (`docs`, `hikes`, `profile`, `tracks`, `trips`, `layout.tsx`) and that the old path no longer exists.
- [x] 1.2 Run `npm run tsc` after the rename and confirm zero new TypeScript errors (existing shell-consuming routes continue to resolve their parent layout).
- [x] 1.3 Run `rg -F '"(site-top-nav)"' app components lib` and confirm zero matches — no source code references the renamed group by string.

## 2. Move the home page into the public shell

- [x] 2.1 `git mv app/page.tsx app/(public)/page.tsx` and confirm `app/page.tsx` no longer exists.
- [x] 2.2 Run `npm run tsc` and confirm zero new TypeScript errors.
- [x] 2.3 In the browser, open `/` and confirm the shared public navbar is now rendered above the existing hero / `AboutSection` / `RecentDocuments` content; confirm `/` still resolves (URL preserved).

## 3. Move the comments page into the public shell

- [x] 3.1 `git mv app/comments/page.tsx app/(public)/comments/page.tsx` and confirm `app/comments/page.tsx` no longer exists.
- [x] 3.2 In the moved `app/(public)/comments/page.tsx`, switch from `PageLayout` (with default `showBackLink`) to a clean `PageLayout` call that does not pass `showBackLink` (post-cleanup it cannot anyway); confirm the rest of the page body is unchanged.
- [x] 3.3 Run `npm run tsc` and confirm zero new TypeScript errors.
- [x] 3.4 In the browser, open `/comments` and confirm the shared public navbar is rendered and no `← Back to Home` link appears at the top of the content area.

## 4. Move the blog route family into the public shell

- [x] 4.1 `git mv app/blog/page.tsx app/(public)/blog/page.tsx`.
- [x] 4.2 `git mv "app/blog/[slug]/page.tsx" "app/(public)/blog/[slug]/page.tsx"`.
- [x] 4.3 `git rm app/blog/layout.tsx` after both page moves and confirm `app/blog/` no longer exists at the top level (verify `ls app/blog` is empty or absent); confirm `app/blog/links` and any other admin/admin-style subdirectories of blog are NOT touched (verify with `git status`).
- [x] 4.4 Run `npm run tsc` and confirm zero new TypeScript errors.
- [x] 4.5 Run `npx eslint "app/(public)/blog/page.tsx" "app/(public)/blog/[slug]/page.tsx" --quiet` and confirm zero warnings.
- [x] 4.6 In the browser, open `/blog` and one `/blog/[slug]` (with a visible published slug) and confirm the shared public navbar is rendered and existing content is unchanged.

## 5. Move the videos route family into the public shell

- [x] 5.1 `git mv app/videos/page.tsx app/(public)/videos/page.tsx`.
- [x] 5.2 `git mv "app/videos/[id]/page.tsx" "app/(public)/videos/[id]/page.tsx"`.
- [x] 5.3 `git rm app/videos/layout.tsx` after both page moves and confirm `app/videos/` no longer exists at the top level; confirm any `app/videos/...` admin subdirectories are NOT touched (verify with `git status`).
- [x] 5.4 Run `npm run tsc` and confirm zero new TypeScript errors.
- [x] 5.5 Run `npx eslint "app/(public)/videos/page.tsx" "app/(public)/videos/[id]/page.tsx" --quiet` and confirm zero warnings.
- [x] 5.6 In the browser, open `/videos` and one `/videos/[id]` (with a visible public video) and confirm the shared public navbar is rendered and existing content is unchanged.

## 6. Drop the legacy back-link affordance from `PageLayout`

- [x] 6.1 `rg -F 'showBackLink' app components lib` and confirm the only matches are inside `components/layout/page-layout.tsx` and the seven call sites that already pass `showBackLink={false}` (documented in design.md); if any other reference appears, stop and decide whether the diff should include it. (Two extra `showBackLink={false}` call sites were found — `app/(public)/docs/[slug]/page.tsx` and `app/(public)/comments/page.tsx` — and `app/(public)/trips/invitations/page.tsx` does not pass the prop. Scope was extended to all eight actual call sites to keep `npm run tsc` clean; the task list below was updated accordingly.)
- [x] 6.2 In `components/layout/page-layout.tsx`: remove the `showBackLink?: boolean` prop from `PageLayoutProps`, remove the `showBackLink = true` default, remove the early-return JSX branch that renders the `<Button variant="ghost" asChild><Link href="/"><ArrowLeft/>Back to Home</Link></Button>`, and remove the now-unused `Link`/`Button`/`ArrowLeft` imports if they are not used elsewhere in the file.
- [x] 6.3 In each call site that still passes `showBackLink={false}`, remove the prop from the `<PageLayout ... />` invocation: `app/(public)/docs/page.tsx`, `app/(public)/docs/[slug]/page.tsx`, `app/(public)/hikes/page.tsx`, `app/(public)/hikes/[slug]/page.tsx`, `app/(public)/tracks/page.tsx`, `app/(public)/tracks/[slug]/page.tsx`, `app/(public)/profile/page.tsx`, `app/(public)/comments/page.tsx`. (Note: `app/(public)/trips/invitations/page.tsx` does not pass the prop — no edit there.) Run `rg -F 'showBackLink' app components lib` after the cleanup and confirm zero remaining matches.
- [x] 6.4 Run `npm run tsc` and confirm zero new TypeScript errors.
- [x] 6.5 Run `npx eslint components/layout/page-layout.tsx "app/(public)/docs/page.tsx" "app/(public)/docs/[slug]/page.tsx" "app/(public)/hikes/page.tsx" "app/(public)/hikes/[slug]/page.tsx" "app/(public)/tracks/page.tsx" "app/(public)/tracks/[slug]/page.tsx" "app/(public)/profile/page.tsx" "app/(public)/trips/invitations/page.tsx" "app/(public)/comments/page.tsx" --quiet` and confirm zero warnings.

## 7. Whole-site validation

- [x] 7.1 Run `npm run tsc` from a clean working tree and confirm zero TypeScript errors.
- [x] 7.2 Run targeted ESLint over all changed and moved files (one invocation per the groups above) and confirm zero warnings.
- [x] 7.3 Run `npm run build` and confirm the build completes successfully. Verify the route list includes `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments`, `/admin/*`, `/sign-in`, `/docs`, `/hikes`, `/tracks`, `/profile`, `/trips/invitations` and that no "duplicate route" / "conflicting routes" errors are reported for any of them.
- [x] 7.4 Manual browser smoke check across the moved routes and the routes that should remain navbar-free: visit `/`, `/blog`, one `/blog/[slug]`, `/videos`, one `/videos/[id]`, `/comments`, `/docs`, one `/docs/[slug]`, `/admin` (after sign-in), and `/sign-in`. For the six moved public routes, confirm the shared public navbar is rendered. For `/admin`, confirm the admin shell is rendered without the shared public navbar. For `/sign-in`, confirm the auth shell is rendered without the shared public navbar.

## 8. Documentation and inventory update

- [x] 8.1 Update `docs/public-navigation-route-coverage.md`: in the Primary Public Routes table, set the `Current navbar state` and `Feature 040 state` cells for `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments` to `Covered by shared public shell` and remove the `Consolidation is deferred to the rollout slice` / `Home keeps its current hero/content layout` / `Comments remains unchanged until the rollout slice` notes; replace the `Follow-up Rollout` section with a one-line summary pointing to the applied feature. (Also renamed the stale `(site-top-nav)` path reference in the docs/tracks rows and the intro paragraph to `(public)` to reflect the rename from task 1.)

## 9. Backlog and history bookkeeping

- [x] 9.1 In `openspec/backlog.md`, move the `public-navbar-route-coverage-rollout` row from `Ready` (in P1 Soon) to the Done numbered-features history section by appending a `feature-089 | feature-089-public-navbar-route-coverage-rollout | navigation/public | …` row to the Completed Features table in `openspec/feature-history.md`, summarising the rollout: home/blog/videos/comments moved under the renamed `(public)` shell, `app/blog/layout.tsx` and `app/videos/layout.tsx` deleted as duplicates, and `PageLayout.showBackLink` removed along with the seven call sites that disabled it.
- [x] 9.2 Run `openspec validate feature-089-public-navbar-route-coverage-rollout --strict` and confirm zero errors.

## 10. OpenSpec archive

- [x] 10.1 Run `opsx:sync feature-089-public-navbar-route-coverage-rollout` to apply the `public-navigation` delta to the main spec (only the `specs/public-navigation/spec.md` delta exists, per status JSON). Confirm the new MODIFIED/ADDED requirements are present in `openspec/specs/public-navigation/spec.md` after sync.
- [x] 10.2 Run `opsx:archive feature-089-public-navbar-route-coverage-rollout` and confirm the change is moved to `openspec/changes/archive/2026-09-23-feature-089-public-navbar-route-coverage-rollout/` along with `.openspec.yaml` and the three (now four) artifact files.
