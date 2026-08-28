## Why

Published GPX-backed tracks should show useful route facts and be ready for map rendering without parsing uploaded GPX files on every public request. This follows the public track download slice by turning each linked GPX file into a stored read model with summary stats, bounds, and simplified map-ready geometry.

## What Changes

- Parse each track's linked GPX file into structured metadata when an admin requests parsing or when a track save/replacement needs parsed data refreshed.
- Store summary fields in the existing `Track.metadata` JSON shell, including distance, bounds, elevation range, time range, and point counts.
- Store simplified map-ready geometry for public Leaflet rendering so later map UI can load a lightweight polyline without re-reading the raw GPX file.
- Add admin visibility for parse state, summary stats, and parse errors on track management surfaces.
- Add public visibility-safe summary data to published track listing/detail reads without adding map UI yet.
- Keep the raw GPX `FileAsset` as the source of truth and preserve existing file visibility/download boundaries.

Non-goals:

- No public or admin map rendering in this slice.
- No hike-to-track association workflow.
- No photo markers, EXIF matching, or timestamp-based photo-to-track interpolation.
- No automatic cleanup or deletion of raw GPX files.
- No provider URL exposure for public pages.
- No new map package decisions beyond preparing geometry for the already selected Leaflet direction.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: Add parsed GPX summary, parse lifecycle, and map-ready geometry behavior for stored tracks.

## Impact

- Data model: use the existing `Track.metadata` JSON field as the persisted parsed read model; a Prisma migration is expected only if implementation discovers JSON is insufficient.
- Data access/actions: extend track helpers or adjacent server-only modules to parse GPX content, update metadata, and expose visibility-safe parsed fields.
- Admin UI: update `/admin/tracks` create/edit/list behavior to show parse status, summaries, and errors, plus a retry/reparse path.
- Public UI/data: update `/tracks` and `/tracks/[slug]` to display parsed summaries when available while preserving draft/private file boundaries.
- Files: read GPX content through the existing app-owned/server-side file access path; do not expose UploadThing provider URLs publicly.
- Dependencies: prefer existing dependencies where possible; add a GPX/XML parser or simplification helper only if it clearly reduces parsing risk.
- Validation: run `npm run tsc`, `npm run lint`, targeted ESLint for changed non-app files, and ask for local `npm run build` because this affects public/admin behavior and may touch Prisma/data paths.
