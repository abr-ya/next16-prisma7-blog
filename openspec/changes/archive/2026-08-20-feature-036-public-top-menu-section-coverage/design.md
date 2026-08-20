## Context

The shared public navbar currently lives in `components/blog-pages/navbar.tsx`, uses the local NavigationMenu primitives, and already handles anonymous versus signed-in account access through `NavbarUserMenu`. The previous hydration fix established that `NavigationMenuList` children must remain valid `NavigationMenuItem` elements.

The public routes to expose already exist: `/`, `/blog`, `/docs`, `/videos`, and `/comments`.

## Goals / Non-Goals

**Goals:**

- Add the missing primary public section links to the existing shared navbar.
- Preserve the hydration-safe NavigationMenu structure.
- Keep anonymous login access and signed-in account menu behavior unchanged.
- Keep the current client/server boundary: navbar interactivity stays client-side; auth state continues to be passed into the component by its callers.

**Non-Goals:**

- No data model, migration, API, or auth storage changes.
- No new search implementation.
- No admin-sidebar restructuring.
- No mounting the shared public navbar into additional public route layouts; the backlog candidate `public-navbar-route-coverage` tracks home, docs, comments, and layout-boundary decisions.
- No full responsive navigation redesign.

## Decisions

1. Keep a static section-link list inside or near the navbar component.
   - Rationale: the section set is small, stable, and maps directly to existing public routes.
   - Alternative considered: introduce a shared navigation registry. That would add abstraction before there is enough cross-surface reuse.

2. Render every link inside a `NavigationMenuItem`.
   - Rationale: this preserves the valid list structure required by the hydration-safe navbar spec.
   - Alternative considered: render raw `Link` or layout nodes directly in `NavigationMenuList`. That risks repeating the invalid markup issue the previous feature fixed.

3. Preserve the existing account menu branch instead of changing auth behavior.
   - Rationale: this feature is public section coverage, not authentication or role-navigation work.
   - Alternative considered: add new account/admin links in the same slice. That overlaps with the separate `admin-sidebar-role-sections` backlog candidate.

## Risks / Trade-offs

- More links can crowd the current navbar on small screens -> Keep wrapping behavior and inspect the layout manually after implementation.
- The existing search control is only a placeholder -> Preserve it as-is so this slice does not expand into search behavior.
- Public `/comments` is currently placeholder-like -> Include it because the route exists and backlog explicitly names comments as a primary public section.

## Migration Plan

No database or data migration is required. Rollback is limited to reverting the navbar and OpenSpec changes for this feature.
