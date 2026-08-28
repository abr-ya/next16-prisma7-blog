## 1. Metadata Contract

- [x] 1.1 Define a typed GPX metadata shape for `Track.metadata`, including parse status, parser version, source file identity, safe error message, summary stats, and map-ready geometry.
- [x] 1.2 Add helpers to read successful, failed, stale, and missing parse states from nullable `Track.metadata`.
- [x] 1.3 Add formatting helpers for public/admin summary values such as distance, elevation range, time range, and point counts.

## 2. GPX Parsing and Simplification

- [x] 2.1 Add server-only GPX content loading for linked active `TRACK_GPX` file assets without exposing provider URLs to public clients.
- [x] 2.2 Parse valid GPX XML into ordered coordinate points, preserving elevation and timestamps when present.
- [x] 2.3 Compute summary stats: distance, bounds, elevation min/max/ascent/descent when available, time start/end/duration when available, and source point counts.
- [x] 2.4 Implement deterministic polyline simplification for `mapGeometry`, preserving route order, start point, end point, and bounds.
- [x] 2.5 Return controlled parse failures for missing/fetch-failed files, invalid GPX XML, and GPX files with no usable coordinates.

## 3. Track Data Actions

- [x] 3.1 Add an authenticated admin parse/reparse action for a track's current linked GPX file.
- [x] 3.2 Persist successful parse metadata to `Track.metadata`.
- [x] 3.3 Persist failed parse metadata with a safe admin-facing error message.
- [x] 3.4 Mark parsed metadata stale or clear current success state when an existing track's linked GPX file is replaced.
- [x] 3.5 Ensure normal admin/public page reads use stored parsed metadata and do not parse raw GPX files during render.

## 4. Admin UI

- [x] 4.1 Update `/admin/tracks` listing or row actions to show parse status and useful parsed summary values.
- [x] 4.2 Update the track create/edit surface to show parse state, stale/failure messaging, and a parse/retry control when a track exists.
- [x] 4.3 Ensure parse actions require authenticated admin access and preserve existing track create/edit/delete behavior.

## 5. Public Track UI

- [x] 5.1 Update public track data helpers to expose parsed summaries and map-ready geometry only for `PUBLISHED` tracks.
- [x] 5.2 Update `/tracks` and/or `/tracks/[slug]` to display parsed summary values when available.
- [x] 5.3 Preserve the existing unparsed fallback with title, description, GPX filename, file size, updated/uploaded dates, and download availability.
- [x] 5.4 Ensure this slice does not render an interactive map.

## 6. OpenSpec Tracking and Validation

- [x] 6.1 Update `openspec/backlog.md` so `outdoor-track-gpx-parsing-summary` is marked `In Progress` with `feature-049-outdoor-track-gpx-parsing-summary`.
- [x] 6.2 Update docs/checklists if implementation changes the outdoor map/package notes or admin/public behavior documentation.
- [x] 6.3 Run `npm run tsc`.
- [x] 6.4 Run `npm run lint`.
- [x] 6.5 Run targeted ESLint for changed non-app files when needed.
- [x] 6.6 Ask the user to run `npm run build` locally and report the result because this slice affects public/admin behavior and file/data paths.
- [x] 6.7 Ask the user to manually check admin parse/retry behavior and public `/tracks` plus `/tracks/[slug]` with parsed, failed, stale, draft, and unparsed track cases.
