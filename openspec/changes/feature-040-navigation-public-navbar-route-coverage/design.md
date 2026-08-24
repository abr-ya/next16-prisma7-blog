## Context

The shared public navbar currently lives in `components/blog-pages/navbar.tsx` and is mounted by the Blog and Videos route layouts. The root layout already provides the i18n provider needed by the localized navbar. Home, Docs, Docs detail, and Comments render their own page content without passing through a public navbar layout.

The route groups that must remain outside this public shell are admin routes, auth routes, API routes, UploadThing routes, and framework/static internals.

This change is intentionally split from the full rollout. It creates the shared public navbar shell, documents the intended route coverage, and applies the shell to Docs as the pilot route family. Home, Comments, and Blog/Videos cleanup remain follow-up work.

## Goals / Non-Goals

**Goals:**

- Provide a documented public route coverage inventory for the navbar rollout.
- Provide one reusable shared public navbar shell for primary public content routes.
- Prove the shell on `/docs` and `/docs/[slug]`.
- Preserve the existing navbar implementation, localized labels, language switcher, back control, search placeholder, and auth-aware login/account behavior.
- Keep server-side session lookup outside client components.
- Keep page-specific public content and metadata behavior intact.

**Non-Goals:**

- Do not redesign the public navbar or replace the search placeholder.
- Do not introduce locale-specific route aliases or page body localization.
- Do not change admin/auth route shells.
- Do not change data models, content queries, visibility filtering, or public URLs.
- Do not move Home, Comments, Blog, or Videos onto the new shell in this slice unless a tiny support change is required to keep the Docs pilot coherent.

## Decisions

### Decision: Document route coverage before broad rollout

Add a small route coverage inventory in project docs before or alongside implementation. It should identify primary public routes, current navbar state, intended shell state, and explicitly excluded route families. This makes the follow-up rollout mechanical instead of rediscovering route boundaries from source each time.

Alternative considered: keep the route list only in the OpenSpec tasks. That is enough for this change, but less useful after the change is archived and implementation moves to the follow-up slice.

### Decision: Use a reusable public navbar shell instead of duplicating navbar markup per page

Mount the shared navbar through a route layout or small server wrapper that can wrap public route content. This keeps session loading and navbar props consistent, avoids copy/pasted navbar calls in every page, and gives future public navigation work one place to reason about route coverage.

Alternative considered: add `Navbar` directly to `app/page.tsx`, `app/docs/page.tsx`, `app/docs/[slug]/page.tsx`, and `app/comments/page.tsx`. That would be fast but would duplicate server session wiring and make the next route coverage change easier to miss.

### Decision: Pilot the shell on Docs only

Apply the new shell to `/docs` and `/docs/[slug]` first. Docs is a useful pilot because it includes both listing and detail routes, is currently missing the shared navbar, and exercises the same public content surface shape that future slices need.

Alternative considered: add the shell to every missing public route immediately. That would complete the original route coverage goal faster, but it mixes the architectural setup with a broad route rollout and makes layout regressions harder to isolate.

### Decision: Keep admin and auth shells separate

The public navbar shell must not wrap `/admin`, `/sign-in`, or `/sign-up`. Admin navigation and authorization remain under the admin layout and server-side role checks. Auth pages keep their current focused flow without public navigation being added as part of this slice.

Alternative considered: mount the navbar from the root layout and hide it for non-public routes. That would broaden the behavior surface and introduce route-condition logic in the global shell, so it is not the preferred shape for this change.

### Decision: Reuse existing navbar behavior as-is

This slice should not change the navbar's visible controls beyond Docs route coverage. The localized labels, supported locales, search placeholder, back navigation, login link, and account menu remain governed by the existing public navigation behavior.

Alternative considered: polish navbar copy or search behavior while touching coverage. Those are separate backlog candidates and would blur validation for this route-boundary change.

## Risks / Trade-offs

- Public layout boundary accidentally wraps admin/auth pages -> Keep the implementation scoped to Docs route files or a reusable wrapper imported only by public routes.
- Docs pages gain extra vertical spacing or duplicated back navigation -> Check Docs listing/detail manually after implementation and adjust page spacing only where needed.
- Docs detail route misses coverage because only listing page is wrapped -> Validate both `/docs` and `/docs/[slug]`.
- Signed-in account state regresses on newly covered pages -> Use the same server-side `authSession()` lookup and navbar props already used by Blog and Videos layouts.
- The shell is too Docs-specific to reuse later -> Keep the wrapper route-agnostic and document intended use in the route coverage inventory.

## Migration Plan

No data migration is required. Deploy as documentation plus route/layout/component wiring changes. Rollback is limited to removing the new public shell usage from Docs and reverting the affected documentation.
