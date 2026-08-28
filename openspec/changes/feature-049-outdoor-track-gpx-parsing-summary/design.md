## Context

See proposal.md for motivation. The project already has `Track` records with a required `FileAssetPurpose.TRACK_GPX` file binding, public `/tracks` pages, and a nullable `Track.metadata` JSON field intentionally reserved for parsed GPX data. Map package direction is documented in `docs/outdoor-map-package-notes.md`: Leaflet is the preferred first renderer, and GPX geometry should be parsed and simplified before public map rendering.

## Goals / Non-Goals

**Goals:**

- Populate `Track.metadata` with a versioned parsed GPX read model.
- Keep raw GPX files as the source of truth while avoiding GPX parsing during normal page requests.
- Store enough summary data for public/admin display and enough simplified geometry for the next map component slice.
- Make parse success, failure, and stale states visible to admins.
- Preserve public visibility rules for draft tracks and private file assets.

**Non-Goals:**

- No interactive map rendering.
- No public API endpoint dedicated to geometry.
- No hike-level combined maps.
- No photo marker or timestamp interpolation workflow.
- No destructive changes to stored files or historical migrations.

## Decisions

1. Use `Track.metadata` as the first parsed read model.
   - Shape the JSON around a stable app-owned schema instead of ad hoc fields:
     - `gpxParse.status`: `SUCCESS`, `FAILED`, or `STALE`
     - `gpxParse.version`: parser/schema version string
     - `gpxParse.parsedAt`
     - `gpxParse.sourceFileAssetId`
     - `gpxParse.sourceFileKey`
     - `gpxParse.errorMessage` for safe admin-facing failures
     - `summary.distanceMeters`
     - `summary.bounds`: north/south/east/west
     - `summary.elevation`: min/max/ascent/descent when available
     - `summary.time`: start/end/duration when available
     - `summary.points`: source and simplified counts
     - `mapGeometry`: ordered simplified coordinate pairs, plus optional elevation/time only if needed later
   - Rationale: existing schema already reserved JSON metadata, and this slice can avoid a migration unless implementation proves JSON is too limiting.
   - Alternative considered: add a separate `TrackGeometry` table now. Deferred because querying one track's map-ready geometry does not yet need relational filtering, and a table can be introduced later if multi-track maps or analytics need it.

2. Treat parsing as an admin/server action, not a public request side effect.
   - Add an authenticated admin reparse path for track rows/edit surfaces.
   - When a new track is created or an existing track's GPX file is replaced, implementation may parse immediately or mark metadata as stale/needed, but public pages must only read stored metadata.
   - Rationale: parsing can involve network/file IO and XML processing, which should not slow or destabilize public rendering.
   - Alternative considered: lazy parse on first public page view. Rejected because it creates surprising public latency and can expose operational failures to visitors.

3. Mark metadata stale when the source file changes.
   - Compare current `fileAssetId` and `fileKey` against the values stored under `gpxParse`.
   - If the linked GPX changes, old summaries and geometry must not be presented as current.
   - Rationale: track identity and file identity are separate; replacing the GPX must not silently reuse old geometry.
   - Alternative considered: clear metadata completely on file replacement. Acceptable, but a stale state gives admins a clearer reason and retry path.

4. Store simplified geometry now, even though map UI is later.
   - The stored geometry should preserve point order, first point, last point, and bounds.
   - A simple deterministic simplification strategy is enough for this slice, with parser versioning so output can be regenerated later.
   - Rationale: this keeps the later `outdoor-track-map-component` slice focused on UI and Leaflet integration instead of mixing UI with file parsing.
   - Alternative considered: store only summary stats now and add geometry during the map slice. Rejected because GPX parsing and map data shape are tightly coupled, and postponing geometry would make the map slice larger and riskier.

5. Keep public data visibility conservative.
   - Public helpers may expose parsed summary and simplified geometry only for `PUBLISHED` tracks.
   - Public data must not expose UploadThing/provider URLs or private GPX download links.
   - Rationale: current public track behavior already separates track publication from file download visibility; parsed metadata should follow the same boundary.
   - Alternative considered: expose geometry for any known track slug because geometry is derived. Rejected because draft track routes must remain private.

## Risks / Trade-offs

- [Risk] Very large GPX files can make parsing slow. -> Mitigation: parse in an authenticated admin action, store a failed state on controlled errors, and avoid parsing during public page requests.
- [Risk] JSON metadata can become awkward if geometry grows large or needs spatial queries. -> Mitigation: keep the JSON schema versioned and allow a later migration to a dedicated geometry table if hike combined maps need stronger querying.
- [Risk] Simplification can remove useful route detail. -> Mitigation: preserve start/end/bounds, record source and simplified point counts, and make simplification deterministic so tracks can be reparsed with a new version if needed.
- [Risk] Hike maps with 5-6 visible tracks may still render too many coordinates at once. -> Mitigation: validate map performance during the combined hike map slice and lower the per-track simplification cap below 1000 points if real devices struggle.
- [Risk] Parser errors could leak provider internals or file URLs. -> Mitigation: store safe admin-facing error categories/messages and keep raw provider details out of UI.
- [Risk] Existing tracks may remain unparsed after deploy. -> Mitigation: show a clear admin parse-needed state and include a manual parse/retry action.

## Migration Plan

1. Prefer no Prisma migration by using `Track.metadata`.
2. Add typed metadata helpers and parser/simplifier modules.
3. Add admin parse/reparse action and update create/edit replacement behavior to keep metadata current or stale.
4. Update admin and public track reads to display parsed summaries when available.
5. Validate with type/lint checks and ask the user to run `npm run build` locally because the sandbox can distort Next/font behavior.

Rollback:

- Because raw GPX files remain the source of truth, rollback can ignore or clear parsed `Track.metadata` values without data loss.

## Open Questions

- Exact simplification tolerance can be tuned during implementation with real GPX examples while preserving the requirement that rendered geometry is not larger than the source geometry.
