## Why

Published GPX-backed tracks should be visible outside the admin area so readers can browse outdoor track notes and download public track files when a file has been intentionally exposed. This follows the track data foundation by adding the first public track surfaces without taking on maps, parsing, or hike associations yet.

## What Changes

- Add public `/tracks` listing and `/tracks/[slug]` detail pages for `PUBLISHED` tracks only.
- Show visibility-safe track metadata such as title, description, status-derived public availability, linked GPX filename, upload/update dates, and file size.
- Add public track data helpers that never return draft tracks or private GPX download URLs.
- Reuse the existing app-owned file download route for GPX downloads when the linked file is `PUBLIC` or `UNLISTED`.
- Show a graceful unavailable state when a published track points at a private or inactive GPX file.
- Add Tracks to the shared public navigation if the route coverage pattern supports adding outdoor public sections in this slice.

Non-goals:

- No GPX geometry parsing, distance/elevation/bounds summaries, or time-series extraction.
- No map rendering.
- No hike-to-track association workflow.
- No automatic file visibility synchronization when a track is published.
- No admin file visibility editing changes beyond relying on existing file-management behavior.
- No tags, search, comments, localization, or photo markers for tracks.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: Add public listing/detail visibility behavior and GPX download availability for published tracks.
- `public-navigation`: Add public route coverage for the tracks section if the shared public navigation is updated in this slice.

## Impact

- Routes: add `/tracks` and `/tracks/[slug]` under the public site-top-nav route group.
- Data access: add public track read helpers under `app/_data/tracks.ts` or a nearby server-only module.
- UI: add public listing/detail components or route-local rendering for track cards, metadata, and download controls.
- File access: reuse `/files/[fileId]/download` for eligible GPX files; do not expose private provider URLs.
- Navigation: optionally add a Tracks link to the shared public navbar.
- Validation: run `npm run tsc`, `npm run lint`, and ask for local `npm run build` because this adds public routes.
