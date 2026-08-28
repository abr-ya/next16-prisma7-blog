## Context

See proposal.md for motivation. The project now has a `Track` model, admin track CRUD, dedicated GPX uploads stored as `FileAssetPurpose.TRACK_GPX`, and an app-owned file download route at `/files/[fileId]/download`. Public outdoor hikes already live under the shared public navbar route group, while maps and parsed GPX geometry are still deferred.

## Goals / Non-Goals

**Goals:**

- Add public track listing and detail pages using existing `Track` records.
- Keep public reads limited to `PUBLISHED` tracks.
- Show useful metadata without parsing GPX files.
- Expose GPX downloads only through the existing app-owned file route and only when file visibility allows it.
- Add Tracks to the shared public navbar and locale resources if route coverage is updated in this slice.

**Non-Goals:**

- No database schema changes.
- No GPX parsing, summary extraction, geometry storage, or map rendering.
- No automatic synchronization between `Track.status` and `FileAsset.visibility`.
- No public hike-track association UI.
- No new map package usage in this slice, even if map dependencies are already installed.

## Decisions

1. Add public read helpers beside existing track data actions.
   - Helpers should return `PUBLISHED` tracks only.
   - Include linked `FileAsset` metadata needed for filename, size, upload/update date, and download availability.
   - Rationale: keeps visibility rules server-side and avoids duplicating query filters in route files.
   - Alternative considered: query Prisma directly in each route. Rejected because public visibility checks are easy to drift.

2. Treat GPX download availability as a derived presentation field.
   - A track is public when `Track.status = PUBLISHED`.
   - A GPX download link is public only when the linked file is `ACTIVE` and has `PUBLIC` or `UNLISTED` visibility.
   - Rationale: content publication and file exposure stay separate until a later workflow explicitly defines how admins publish/download GPX files.
   - Alternative considered: automatically show `/files/[id]/download` for any published track. Rejected because private file assets would still require auth and create confusing public UI.

3. Reuse the existing app-owned file download route.
   - Public pages link to `/files/[fileId]/download`, not the UploadThing provider URL.
   - Rationale: preserves the existing access-control and audit boundary.
   - Alternative considered: add `/tracks/[slug]/download`. Deferred until public track download policy needs track-specific logging, slug-stable URLs, or richer response behavior.

4. Put track public routes under the shared public navbar shell.
   - Add `app/(site-top-nav)/tracks/page.tsx` and `app/(site-top-nav)/tracks/[slug]/page.tsx`.
   - Add a `Tracks` link to the shared navbar and locale resources.
   - Rationale: matches the newer docs/hikes public route layout and keeps public navigation consistent.

## Risks / Trade-offs

- [Risk] Published tracks with private GPX files may look incomplete. -> Mitigation: show a clear unavailable download state and keep automatic visibility sync out of scope.
- [Risk] No parsed GPX summary means public metadata is basic. -> Mitigation: defer distance, elevation, bounds, time range, and map preview to the parsing/map slices.
- [Risk] The existing `/files/[fileId]/download` route returns 403 for private files; public track pages should avoid showing links that will fail. -> Mitigation: derive download availability server-side before rendering.
- [Risk] Adding another public navbar item can crowd smaller screens. -> Mitigation: use the existing wrapping navbar behavior and validate visually in a browser.

## Migration Plan

1. No Prisma migration is needed.
2. Add public read helpers and route components.
3. Add navbar link and locale labels.
4. Validate with `npm run tsc`, `npm run lint`, targeted lint for changed non-app files, and local browser checks.

## Open Questions

- The exact admin workflow for making GPX files public remains deferred. This slice can still ship with download availability based on current `FileAsset.visibility`.
