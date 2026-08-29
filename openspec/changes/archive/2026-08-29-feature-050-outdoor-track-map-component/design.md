## Context

See proposal.md for motivation. The project already has public `/tracks/[slug]` pages and `Track.metadata` can now expose successful parsed summaries plus simplified `mapGeometry` for published tracks. `docs/outdoor-map-package-notes.md` selects Leaflet with React Leaflet for the first map implementation, and both packages are already installed.

## Goals / Non-Goals

**Goals:**

- Render one public track route on `/tracks/[slug]` using stored `mapGeometry`.
- Keep the route page server-rendered where possible while isolating Leaflet in a browser-only client component.
- Fit the map to the stored track bounds and show start/end markers.
- Provide a calm fallback when geometry is missing, failed, stale, or too small to map.
- Keep public data access limited to published tracks and visibility-safe metadata.

**Non-Goals:**

- No GPX parsing changes and no raw GPX fetch during map rendering.
- No map on `/tracks` listing.
- No multi-track hike map.
- No photo markers, layer toggles, manual points, route editing, or custom tile infrastructure.
- No Prisma migration.

## Decisions

1. Add a dedicated client-only public track map component.
   - The server detail page passes a small serializable view model: title, summary bounds, and `mapGeometry`.
   - The map component imports Leaflet/React Leaflet only from a client boundary and is loaded dynamically with SSR disabled if needed.
   - Rationale: React Leaflet depends on browser APIs, while the route should keep normal server data loading and not risk SSR crashes.
   - Alternative considered: render Leaflet directly in the server page. Rejected because Leaflet is browser-only.

2. Use stored `mapGeometry` as the only route geometry input.
   - The map does not fetch provider URLs, raw GPX files, or parse XML.
   - Rationale: feature 049 already made a lightweight read model for exactly this purpose.
   - Alternative considered: fetch `/files/[fileId]/download` and parse GPX client-side. Rejected because it would duplicate parsing, increase payload size, and weaken file visibility boundaries.

3. Fit bounds from route coordinates and summary bounds.
   - Prefer stored summary bounds for initial fit.
   - Fall back to coordinate-derived bounds if needed.
   - For one coordinate, center the map instead of fitting a route.
   - Rationale: robust behavior for small or unusual tracks while still using parsed metadata.

4. Keep the first map visually focused and reusable.
   - Render OSM-compatible tiles, a single polyline, and start/end markers.
   - Do not add layer controls until hike maps or photo markers need them.
   - Rationale: the single-track map should prove the browser/client integration before adding map complexity.

5. Treat map validation as browser validation, not only static checks.
   - Static checks catch TypeScript/import issues.
   - Manual browser checks must confirm the map is nonblank, correctly framed, responsive, and still usable on mobile.
   - Rationale: Leaflet failures often appear as empty tiles, zero-height containers, missing marker icons, or SSR/client hydration problems.

## Risks / Trade-offs

- [Risk] Leaflet CSS or marker assets may not load correctly in Next.js. -> Mitigation: import Leaflet CSS from the client/map boundary and explicitly handle marker icons if the default asset paths fail.
- [Risk] A map container without stable height can render blank. -> Mitigation: give the map component stable responsive dimensions.
- [Risk] Public track listing could become heavier if it fetches geometry for every card. -> Mitigation: keep the map only on detail and do not require listing geometry.
- [Risk] Large geometry can hurt mobile interaction. -> Mitigation: rely on feature 049 simplified geometry, then manually check a real parsed track; future hike map work can lower simplification caps further.
- [Risk] Tile providers have usage policies and availability limits. -> Mitigation: use standard OSM-compatible tiles for the first slice and avoid building app-specific tile infrastructure in this feature.

## Migration Plan

1. No database migration is expected.
2. Add the client map component and any route-local wrapper needed for dynamic import.
3. Update `/tracks/[slug]` to render the map only when successful map-ready geometry exists.
4. Preserve existing summary/download fallback behavior for unparsed, failed, or stale tracks.
5. Validate with `npm run tsc`, `npm run lint`, targeted ESLint for changed non-app files, local `npm run build`, and manual browser checks across desktop/mobile.

Rollback:

- Remove the map component usage from `/tracks/[slug]`; stored parsed metadata remains useful for summaries and future map work.
