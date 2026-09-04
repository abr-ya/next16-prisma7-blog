## Context

See `proposal.md` for motivation. Published `/hikes/[slug]` already lists linked published tracks and photos. `/tracks/[slug]` already renders one stored-geometry Leaflet map through `TrackMap` / `TrackMapLeaflet`. Public hike reads currently select only track title, slug, description, status, and timestamps — they do not include `Track.metadata` or a map view model. Feature-058 already decided this slice should compose stored map-ready geometry and combined bounds, without photo markers or day filtering.

## Goals / Non-Goals

**Goals:**

- Build a public hike map from existing stored track geometry and summary bounds.
- Keep Leaflet behind a client-only boundary, matching the single-track map.
- Expose only visibility-safe map fields from public hike helpers.
- Leave `/tracks/[slug]` map behavior unchanged.

**Non-Goals:**

- No Prisma migration, GPX parser change, or new map dependency.
- No admin hike map, listing map, photo markers, day filter, or notes layer.
- No required track legend, layer toggles, or route editing.

## Decisions

### Compose a multi-track Leaflet map from the existing single-track map

Keep `TrackMap` as the single-track public wrapper used by `/tracks/[slug]`. Generalize the Leaflet renderer to accept one or more serializable track view models (`title`, `bounds`, `geometry`) so a hike page can pass every eligible linked track. Add a hike-facing wrapper, following the existing `components/track-pages` client-only dynamic-import pattern, rather than mounting several `TrackMap` instances.

Alternative considered: fetch each track page's map independently or parse GPX on the hike page. That would duplicate requests, risk leaking file URLs, and break the stored-metadata boundary from feature-049/050.

### Put map eligibility in the public hike read model

Extend `getPublicHikeBySlug` so each linked published track can carry the same map view model already used on track detail: current successful parsed `mapGeometry` with length greater than zero, plus stored summary bounds. Reuse `getTrackGpxMetadataState` instead of sending raw `Track.metadata` to the page. Draft tracks remain excluded by the existing published-track association filter.

Alternative considered: load geometry in the page component after fetching tracks. That makes it easier to leak unpublished or failed parse payloads and diverges from the current public DTO pattern.

### Render the map only when at least one linked track is map-eligible

Place the map under the hike title and description, before the linked-track list. If no linked published track has current map-ready geometry, omit the map rather than showing a broken or empty map control. If some linked published tracks are mappable and others are not, render only the mappable polylines and keep the existing linked-track list for all published associations.

Alternative considered: always show a fallback box like the track detail page. On a hike with no mapped tracks that box would look like a failed widget; omitting it keeps the page usable.

### Fit combined stored bounds and keep start/end markers simple

Compute the viewport from the union of stored summary bounds for the rendered tracks, with padding consistent with the single-track map. If only one mapped track is present, keep the existing start/end marker behavior. If two or more mapped tracks are present, render distinct polylines (a small color palette is enough) and skip per-track start/end markers so overlapping day routes stay readable. Optional hover/focus titles on polylines may use the public track title; they MUST NOT expose file URLs or parse errors.

Alternative considered: show start/end markers on every track. That is useful for one route and noisy for 3-10 overlapping day tracks, which is the hike case described in `docs/outdoor-map-package-notes.md`.

### Do not change schema, parser, or track pages

This slice reads existing `Track.metadata`. Combined bounds are derived at read/render time, not stored on `Hike`. Photo, note, and day-filter layers stay later slices, so the hike map view model should be track-polylines-only and easy to extend later.

Alternative considered: persist combined hike bounds on the hike row. That would need invalidation on every attach/detach/reparse and is unnecessary while track metadata already has per-track bounds.

## Risks / Trade-offs

- [Risk] Multiple polylines can overlap and become hard to distinguish. -> Mitigation: use distinct polyline colors for multi-track hikes; keep start/end markers only for the single-mapped-track case.
- [Risk] Public hike payloads grow if every linked track includes simplified geometry. -> Mitigation: include geometry only for published tracks with current successful map-ready geometry; do not send raw GPX or failed/stale metadata.
- [Risk] Antimeridian or globally split bounds can produce a bad fit. -> Mitigation: use stored summary bounds as-is for this slice; unusual world-wrapping tracks can be revisited if a real hike hits them.
- [Risk] Leaflet height/CSS issues can produce a blank map on the hike page even if the track page works. -> Mitigation: reuse the existing map container sizing and client-only import, then manually check `/hikes/[slug]` on desktop and mobile.
- [Risk] Future photo markers need the same map instance. -> Mitigation: keep the hike map wrapper track-layer-only, with a view model that can later accept markers without changing public track pages.

## Migration Plan

1. No database migration.
2. Extend the public hike read model with visibility-safe map view models for linked published tracks.
3. Generalize the Leaflet renderer for multiple tracks and add the hike detail map section.
4. Preserve `/tracks/[slug]` map rendering through the existing single-track wrapper.
5. Validate with `npm run tsc`, `npm run lint`, targeted ESLint for changed non-`app` files, local `npm run build`, and browser checks for hikes with zero, one, and several mapped tracks.

Rollback: remove the hike map section and extra public map fields. Stored track geometry, hike-track associations, and `/tracks/[slug]` maps remain in place.
