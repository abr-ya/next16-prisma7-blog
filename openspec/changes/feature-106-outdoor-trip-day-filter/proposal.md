# Proposal

## Why

The existing trip day selector filters only map layers, while the linked track cards and photo gallery continue to show every trip day. A single trip-wide day context will make the detail page easier to follow and prevent a selected day from appearing to conflict with the media beneath the map.

## What Changes

- Move the public multi-day trip selector from the map-local component to the shared trip media surface so one selected day filters the map, linked track cards, and photo gallery together.
- Keep `All days` as the default and preserve the current single-day-trip behavior without a redundant selector.
- Include only tracks and photos that are confidently assigned to the selected day; photos without a reliable capture-day assignment remain available in `All days` only.
- Keep the existing photo sort control and lightbox navigation scoped to the currently visible photo set, while preserving photo access, visibility, EXIF, map-coordinate, and upload behavior.
- Keep day selection client-local for this slice: it does not add URL state, browser-history entries, data migrations, or administrator UI changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Extend the public trip day-filter requirement from map layers to the linked track and photo gallery surfaces.

## Impact

- Affects the public `/trips/[slug]` trip-media composition, its map day-selector ownership, track-card rendering, photo gallery input, and visibility-safe public photo projection.
- Reuses stored parsed GPX/EXIF time metadata and existing `HikeMapDay` keys; no Prisma schema, migration, raw-file parsing, or new dependency is required.
- Does not alter `/admin` association management, photo contribution permissions, image-access rules, existing `photo` / `photoOrder` URL behavior, or the current map-focused photo action.
