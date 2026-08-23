## Context

The shared public navbar currently lives in `components/blog-pages/navbar.tsx` and is mounted by the Blog and Videos route layouts. The root layout already provides the i18n provider needed by the localized navbar. Home, Docs, Docs detail, and Comments render their own page content without passing through a public navbar layout.

The route groups that must remain outside this public shell are admin routes, auth routes, API routes, UploadThing routes, and framework/static internals.

## Goals / Non-Goals

**Goals:**

- Provide one consistent shared public navbar boundary for primary public content routes.
- Preserve the existing navbar implementation, localized labels, language switcher, back control, search placeholder, and auth-aware login/account behavior.
- Keep server-side session lookup outside client components.
- Keep page-specific public content and metadata behavior intact.

**Non-Goals:**

- Do not redesign the public navbar or replace the search placeholder.
- Do not introduce locale-specific route aliases or page body localization.
- Do not change admin/auth route shells.
- Do not change data models, content queries, visibility filtering, or public URLs.

## Decisions

### Decision: Use a public route shell instead of duplicating navbar markup per page

Mount the shared navbar through a route layout or small server wrapper that covers the primary public content routes. This keeps session loading and navbar props consistent, avoids copy/pasted navbar calls in every page, and gives future public navigation work one place to reason about route coverage.

Alternative considered: add `Navbar` directly to `app/page.tsx`, `app/docs/page.tsx`, `app/docs/[slug]/page.tsx`, and `app/comments/page.tsx`. That would be fast but would duplicate server session wiring and make the next route coverage change easier to miss.

### Decision: Keep admin and auth shells separate

The public navbar shell must not wrap `/admin`, `/sign-in`, or `/sign-up`. Admin navigation and authorization remain under the admin layout and server-side role checks. Auth pages keep their current focused flow without public navigation being added as part of this slice.

Alternative considered: mount the navbar from the root layout and hide it for non-public routes. That would broaden the behavior surface and introduce route-condition logic in the global shell, so it is not the preferred shape for this change.

### Decision: Reuse existing navbar behavior as-is

This slice should not change the navbar's visible controls beyond route coverage. The localized labels, supported locales, search placeholder, back navigation, login link, and account menu remain governed by the existing public navigation behavior.

Alternative considered: polish navbar copy or search behavior while touching coverage. Those are separate backlog candidates and would blur validation for this route-boundary change.

## Risks / Trade-offs

- Public layout boundary accidentally wraps admin/auth pages -> Keep the implementation scoped to public route files or a route group that excludes `app/admin` and `app/(auth)`.
- Existing pages gain extra vertical spacing or duplicated back navigation -> Check Home, Docs, Docs detail, Comments, Blog, and Videos manually after implementation and adjust page spacing only where needed.
- Detail routes miss coverage because only listing pages are wrapped -> Validate both listing and detail routes for Blog, Docs, and Videos.
- Signed-in account state regresses on newly covered pages -> Use the same server-side `authSession()` lookup and navbar props already used by Blog and Videos layouts.

## Migration Plan

No data migration is required. Deploy as a route/layout and component wiring change. Rollback is limited to removing the new public shell or reverting the affected route layout changes.
