## Why

The authenticated photo viewer offers a `Show on map` action, but it currently closes the viewer while leaving the visitor at the gallery. The map already accepts the selected coordinate and flies to it, yet the visitor cannot see that result without manually scrolling back up the trip page.

## What Changes

- Make `Show on map` from an authenticated trip photo viewer scroll the map into view and focus it after closing the viewer.
- Preserve the existing selected-photo coordinate handoff, map day visibility, and Leaflet fly-to/zoom behavior.
- Provide an accessible focus target and predictable focus order around the programmatic map navigation.
- Do not add map markers, alter coordinate eligibility, change photo viewer access, or change map data/tiles.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Require the authenticated photo-viewer map action to reveal and focus the existing trip map for an accepted photo coordinate.

## Impact

- Affects the public `/trips/[slug]` photo viewer, trip media composition, and map wrapper accessibility only.
- Does not affect Prisma schema, database data, server actions, authorization, or dependencies.
