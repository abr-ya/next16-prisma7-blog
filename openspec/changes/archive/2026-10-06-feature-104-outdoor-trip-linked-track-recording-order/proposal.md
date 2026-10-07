# Proposal

## Why

Visitors and administrators currently see linked trip tracks in reverse association order, which obscures the route sequence when several GPX files describe one trip. Ordering the existing stored recording instants chronologically makes both views reflect the trip as it happened without reparsing source files.

## What Changes

- Order linked track cards on published trip detail pages by successful parsed GPX recording start instant, ascending.
- Apply the same chronological order in the administrator **Manage tracks** trip dialog.
- Show the stored recording date-time range and selected recording timezone on attached administrator track cards when successful parsed time metadata is available.
- Put tracks without a usable stored recording start after dated tracks, retaining their existing reverse-association order as a stable fallback.
- Preserve each track's existing selected recording-timezone display, visibility boundaries, association actions, and map behavior.

## Non-goals

- Adding a manually entered recording date for tracks without GPX time metadata.
- Reparsing GPX files, changing parsed metadata, or deriving dates in the browser.
- Changing track order on standalone `/tracks`, `/my/tracks`, or map-layer behavior.
- Adding manual per-trip track ordering controls.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `outdoor-hike-media-map`: Linked trip tracks use a deterministic chronological presentation order on public and administrator trip surfaces.

## Impact

- Affects the trip data projection in `app/_data/hikes.ts` and linked-track presentation in `components/hike-pages` and `components/admin-pages/hikes-admin-panel.tsx`.
- Reuses parsed GPX metadata already stored in `Track.metadata`; no Prisma schema, migration, API, or dependency changes are expected.
