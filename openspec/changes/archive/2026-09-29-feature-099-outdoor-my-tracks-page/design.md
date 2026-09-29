# Design

## Context

The existing `Track` model already has an owner, required GPX `FileAsset`, optional parsed metadata, publication status, recording timezone, and optional many-to-many trip associations. The current server helpers already scope track reads and mutations to the signed-in owner; `/admin/tracks` uses that owner-scoped surface. The public `/tracks` routes intentionally expose only published records and visibility-safe file information.

## Goals / Non-Goals

**Goals:**

- Make the established owner-scoped track workflow reachable from the public-site account menu without adding a new data model.
- Create tracks independently of trips and make their unlinked state clear.
- Keep authorization and GPX file eligibility enforced by server actions rather than client filtering.

**Non-Goals:**

- Add track-to-trip association controls, a new GPX parsing protocol, or a cross-user administration workflow.
- Move or remove the existing `/admin/tracks` surface.

## Decisions

### Reuse the existing track domain and actions

`/my/tracks` will query the current user's existing track list and call the established create, update, timezone, parse, and delete actions. This keeps validation, file ownership checks, metadata staleness, and revalidation rules in one domain path. A separate personal-track model or duplicate action set would risk permission and parsing drift.

### Create a private public-shell route

The route will live under the public route group so it receives the shared authenticated navbar, but it will require a server-side session before fetching records. This mirrors `/profile`: it is part of public navigation chrome, not public content. The user-menu link is authenticated-only; direct route access remains protected independently.

### Reuse the track form as a personal management UI

The existing client-side track panel already integrates the GPX uploader, form validation, parse controls, timezone selection, and destructive-action confirmation. The implementation should extract or parameterize only the portions needed to render an owner-scoped page, rather than copy the entire admin panel. The page must not expose admin-only cross-user data or controls.

### Independent upload creates no association

The create workflow will not write `HikesToTracks`. The list will render existing associations read-only so users can distinguish an independent track from one linked elsewhere. Association changes remain a later focused feature.

## Risks / Trade-offs

- [Admin panel extraction grows into a broad refactor] → keep the shared surface limited to existing owner-safe controls; defer structural cleanup not needed by the new page.
- [A client-side list leaks cross-user data] → fetch only owner-scoped data after server authentication and retain checks within every action.
- [A draft or private GPX becomes public after personal upload] → preserve current status and FileAsset visibility defaults; public routes continue their independent published/visibility checks.
- [Replacing a file leaves uploaded assets behind] → preserve the current file lifecycle and pending-delete behavior; do not add deletion semantics in this slice.

## Migration Plan

No database migration is required. Deploy the authenticated route and menu entry together; rollback consists of removing the route and link, leaving existing tracks and file assets unchanged.
