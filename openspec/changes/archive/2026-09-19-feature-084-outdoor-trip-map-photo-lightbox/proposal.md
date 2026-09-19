## Why

Trip-map photo markers currently provide only a title and thumbnail, leaving the map disconnected from the existing photo viewer. A signed-in visitor should be able to open the selected mapped photo directly, while guests need a clear explanation without exposing full-size media.

## What Changes

- Connect a single map-photo marker to the existing trip photo lightbox for its mapped photo.
- Let a grouped marker present its colocated photos as explicit selectable entries before opening the selected photo.
- Preserve the authenticated full-photo boundary: guests receive sign-in guidance instead of a full-size image URL or bytes.

## Non-goals

- Do not add a standalone photo route, alter photo coordinate acceptance, change lightbox navigation, or expose full photos to guests.
- Do not change map marker grouping, map layers, image storage, or photo ownership and visibility rules.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Let public trip-map photo markers open the existing authenticated photo lightbox through visibility-safe selection behavior.

## Impact

- Affects the public `/trips/[slug]` map/photo client boundary, Leaflet photo marker popups, and the existing trip photo gallery lightbox.
- No Prisma schema, route, server action, dependency, or image access-policy changes.
