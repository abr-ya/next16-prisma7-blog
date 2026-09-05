## Context

See `proposal.md` for motivation. The current public hike photo section renders the first ordered `PhotoImage.fileAsset` through `/files/[fileId]/download?disposition=inline` inside a small CSS-framed `<img>`. The response is still the original uploaded image asset; there is no outdoor photo thumbnail model, generated derivative, or public thumbnail route.

`Log.userId` is required and references `User.id`, so anonymous image requests must not create regular `Log` rows unless the logging model is changed in a separate slice.

## Goals / Non-Goals

**Goals:**

- Ensure anonymous visitors can only receive thumbnail-sized hike photo image bytes.
- Require authentication for full-size linked hike photo image access and large-photo viewer controls.
- Keep public hike pages guest-readable when hikes are published.
- Keep full provider URLs, inactive files, draft photos, draft hikes, and EXIF/GPS metadata out of public responses.
- Add a reusable viewer component for signed-in users that supports current/next/previous navigation.

**Non-Goals:**

- No standalone public `/photos` or `/photos/[slug]` route.
- No participant-only policy yet; any signed-in site user may use the full viewer in this slice.
- No comments, reactions, albums, map markers, or photo upload-from-hike workflow.
- No bulk migration that rewrites existing original image assets.
- No persistent thumbnail derivative storage, cleanup, or multi-size catalog in this slice.

## Deferred Simplifications (tracked in backlog)

These are intentional short-cuts for this slice. Each has a P1 Soon backlog follow-up so the simplification is not forgotten.

| Simplification in feature-057 | Why simplified now | Backlog follow-up (P1 Soon) |
| --- | --- | --- |
| On-demand thumbnail bytes with cache headers; no stored derivatives | Prove guest thumbnail vs authenticated full-image boundaries without derivative lifecycle, UploadThing storage, cleanup, or migration scope | `outdoor-photo-persistent-thumbnail-derivatives` |
| Any authenticated site user may open the large viewer and fetch full hike photo images | Participants membership is not shipped yet; this slice only needs anonymous vs signed-in | `outdoor-hike-full-photo-viewer-audience` (depends on `outdoor-hike-participants`) |

## Decisions

### Add explicit thumbnail serving instead of CSS-only previews

Guest-visible images should come from an app-owned thumbnail endpoint such as `/files/[fileId]/thumbnail`, returning constrained image bytes with bounded dimensions and cache headers. This endpoint should verify that the file is an active outdoor photo image belonging to a published photo associated with a published hike.

Alternative considered: keep the current `<img>` and rely on CSS sizing. That does not meet the requirement because the browser still receives the original full-size file.

Alternative considered: use `next/image` directly over the current download route. That can reduce delivered bytes in normal rendering, but it leaves access control tangled with a route that should reject anonymous full-image requests. A dedicated thumbnail endpoint makes the boundary testable.

### Use `sharp` for deterministic thumbnail bytes

Add `sharp` as an explicit runtime dependency and use it inside the thumbnail endpoint to resize the provider image to a fixed maximum dimension, strip metadata, and return a web-friendly image format. This is a justified dependency because technical thumbnails are central to the privacy/access requirement.

Alternative considered: rely on provider-side transformations. The current UploadThing integration stores only original file URLs and the project does not already track transformation URLs.

### Generate thumbnails on demand for this slice

This slice should generate thumbnail bytes on request and rely on bounded dimensions plus aggressive cache headers. It should not store thumbnail derivatives in the database, UploadThing, or local filesystem yet.

This is an explicit short-term decision, not the final media architecture. Persistent thumbnail derivatives are tracked as P1 Soon follow-up `outdoor-photo-persistent-thumbnail-derivatives` and should be revisited after the large-photo viewer is proven, especially if photo counts grow, repeated thumbnail generation becomes expensive, galleries/albums need multiple sizes, or cleanup/regeneration workflows become necessary.

Alternative considered: create and store derivative `FileAsset` rows immediately. That would improve repeat performance and make thumbnail URLs more stable, but it adds derivative lifecycle, cleanup, regeneration, and migration scope before the access boundary itself has been proven.

### Keep originals behind the existing download route with stronger photo access checks

`/files/[fileId]/download` should continue to serve existing non-photo files according to their current visibility rules. For outdoor photo image assets that are public only because of a published hike association, full-size access should require an authenticated session before returning bytes.

Admin file previews may continue to work for authenticated users. Anonymous guests requesting full outdoor photo images directly should receive an authentication-required response.

### Put viewer state in a client component, data filtering on the server

The server page should pass a visibility-safe ordered photo list with thumbnail URLs and authenticated-only full URLs when the viewer is allowed. A client lightbox component should handle opening, closing, next/previous navigation, focus behavior, and responsive image sizing.

Alternative considered: fetch full photo data from the client when opening the viewer. That adds unnecessary client/server API surface for this slice.

## Risks / Trade-offs

- Thumbnail generation can add response cost -> Mitigation: cache generated thumbnail responses aggressively and keep dimensions bounded.
- First request for a thumbnail fetches the original provider asset server-side -> Mitigation: no provider URL is exposed to clients and metadata is stripped from the returned derivative.
- On-demand thumbnails may not scale indefinitely -> Mitigation: P1 follow-up `outdoor-photo-persistent-thumbnail-derivatives` after real usage and gallery needs are clearer.
- Adding `sharp` can affect install/build behavior -> Mitigation: pin it as a normal dependency and include build validation.
- Any signed-in user can view full photos in this slice -> Mitigation: documented explicitly; P1 follow-up `outdoor-hike-full-photo-viewer-audience` after `outdoor-hike-participants`.
- Existing image URLs may be cached by browsers during development -> Mitigation: change public hike image `src` to the new thumbnail URL so behavior is easy to verify.

## Migration Plan

1. Add the dependency and app-owned thumbnail route.
2. Update full photo access checks before wiring the viewer so direct anonymous full-image requests stop working.
3. Update public hike read models and UI to emit thumbnail URLs for all visitors and full URLs only for authenticated users.
4. Validate with TypeScript, lint, OpenSpec, build, and manual browser checks for anonymous and signed-in sessions.

Rollback: revert the viewer and thumbnail route wiring. Original `FileAsset` rows and uploaded image bytes remain unchanged.
