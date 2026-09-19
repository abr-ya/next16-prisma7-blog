## Context

The trip map and gallery already receive the same published photo identities, but marker interactions are rendered inside the Leaflet map subtree while the existing lightbox state lives in `HikePhotoGallery`. Marker popups currently expose only static visibility-safe title and thumbnail content.

## Goals / Non-Goals

**Goals:**

- Route a selected map-photo identity to the existing gallery viewer.
- Keep one photo-selection flow for single and grouped markers.
- Preserve guest/authenticated full-image access boundaries.

**Non-Goals:**

- Add a new photo viewer, public photo route, or direct image delivery path.
- Change marker grouping, coordinate logic, gallery ordering, or viewer navigation.

## Decisions

### Lift map-photo selection to the trip media boundary

`HikeTripMedia` will own a selected map-photo callback and pass it to both the map and gallery. The gallery resolves the received photo ID against its existing ordered list and opens its existing viewer state. This avoids duplicating lightbox behavior in the Leaflet layer.

### Keep the marker popup as the selection affordance

Single markers will expose a selectable visibility-safe photo entry, and grouped popups will make each existing entry selectable. This preserves the current grouping model and lets a visitor choose among colocated photos.

### Enforce the existing gallery access boundary

The gallery remains responsible for allowing full viewer opening only when the authenticated full-photo capability is present. For guests, the map selection reports a sign-in requirement without requesting a full-size image.

## Risks / Trade-offs

- [Leaflet popup interaction may not naturally share React event state] → pass a narrow photo-ID callback through the existing map component boundary.
- [Grouped markers can have many entries] → retain the current bounded scrollable popup and individual title/thumbnail entries.
- [Guest selection may be mistaken for a broken control] → show explicit sign-in guidance instead of silently doing nothing.

## Migration Plan

No schema, migration, data rewrite, dependency, or access-policy migration is required. Removing the callback restores the current marker-only behavior.
