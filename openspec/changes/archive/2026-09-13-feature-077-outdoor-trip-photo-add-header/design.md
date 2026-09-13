## Context

The public trip route currently loads the server-authoritative photo-contribution capability and renders its client contribution form after the trip media and linked-track content. The gallery owns the Photos heading but returns no section when its photo list is empty. The existing contribution form owns the upload-dialog state, submission feedback, quota messaging, and refresh behavior.

There are no data-model, API, or authorization changes in this relocation.

## Goals / Non-Goals

**Goals:**

- Compose the existing contribution workflow into the Photos section header.
- Allow the header/action to render for an eligible contributor before the first photo exists.
- Preserve the existing client upload-dialog behavior and server-side enforcement.

**Non-Goals:**

- Duplicate or alter capability queries, contribution authorization, quota calculation, upload validation, or photo persistence.
- Change gallery visibility, full-image access, admin photo workflows, or legacy route redirects.

## Decisions

### Let the gallery-level Photos section own header composition

The trip media/gallery composition will receive the already-loaded optional contribution capability and render a single Photos section whenever either linked photos exist or a contribution affordance is applicable. This keeps the heading, gallery grid, and related action in one visual boundary.

Alternative: place a second Photos header around the existing bottom form from the route. Rejected because it duplicates the section context and does not keep the action adjacent to the gallery.

### Reuse the existing client contribution form as a header action

The existing form will be reshaped to provide compact header-action UI while retaining its dialog state, submission callback, quota disabled state, and feedback. The server page will continue to supply the existing capability projection.

Alternative: create a new upload trigger/dialog for the gallery. Rejected because it risks diverging upload, refresh, and quota behavior from the proven contribution workflow.

### Preserve server authority and data behavior

This is a presentation-only composition change. The existing server action remains the sole authority for session, membership/role, published trip linkage, assets, and quota validation. No Prisma schema, migration, revalidation contract, API, or admin surface changes are necessary.

## Risks / Trade-offs

- [The gallery currently hides when empty] → Render its section when a contribution capability exists, while keeping the grid empty until a photo is submitted.
- [Header controls can wrap on narrow viewports] → Use the existing responsive flex/wrap layout patterns so the heading and action remain usable.
- [Client trigger refactor could accidentally lose disabled or toast behavior] → Keep the established dialog state and submit path intact; manually test both eligible and quota-reached states.

## Migration Plan

Deploy as a normal UI change with no data migration. Rollback restores the current composition only; stored photos, uploads, quotas, and authorization state are unaffected.
