## Context

See `proposal.md`. The public hike query already produces one `HikePhotoMapMarker` per eligible linked photo, and the Leaflet map renders one pin and hover tooltip per item. Pins at identical latitude/longitude overlap exactly; direct EXIF GPS and approved inferred/manual coordinates have already been resolved by the data layer.

## Goals / Non-Goals

**Goals:**

- Convert the already-public marker list into coordinate groups at the map presentation boundary.
- Preserve the single-photo pin and hover tooltip while giving multi-photo groups a count-labelled pin and explicit click popup.
- Keep all group contents within the existing public thumbnail and title boundary.

**Non-Goals:**

- Do not change marker eligibility, coordinate selection, public querying, persistence, or map bounds.
- Do not introduce proximity clustering: nearby-but-distinct coordinates remain separate pins.
- Do not add controls that open full images, nor any server mutation or database migration.

## Decisions

### Group only exact coordinate pairs in the client map component

Build a small, deterministic grouping helper from the existing marker array, keyed by the latitude and longitude values already emitted for map placement. It returns one group per coordinate and keeps its photos in the query-provided order.

Rationale: exact overlap is the observed failure and needs no coordinate precision policy, data contract change, or extra server work. Grouping after eligibility selection ensures no private or otherwise ineligible photo enters the popup.

Alternative considered: radius clustering. Rejected because it changes normal nearby-marker discovery and introduces zoom-dependent behavior beyond this narrow fix.

### Use a count-labelled grouped pin and click popup

Keep the current `P` icon for a group of one with its concise hover/focus tooltip. For a group of two or more, render a pin labelled with the count and a Leaflet popup containing a compact list/grid of every group member's existing thumbnail (when present) and title.

Rationale: a visible count explains that the pin represents multiple photos, while a click popup is intentional and usable on touch devices. It avoids stacking or spiderfying icons at one coordinate.

Alternative considered: a long hover tooltip. Rejected because it is fragile on touch and can be awkward with 5–10 photos.

### Preserve existing visibility boundaries end-to-end

The grouping helper accepts only `HikePhotoMapMarker` values. Popup content uses `thumbnailUrl` and `title` already approved for the public marker surface; it does not link to a provider URL, a download route, or a full-image viewer.

Rationale: the feature changes presentation only. Authentication and full-image access policies remain untouched.

## Risks / Trade-offs

- [Risk] A large group makes the popup tall on a small viewport → Mitigation: use a compact, bounded popup layout that can scroll while retaining every photo.
- [Risk] Floating-number coordinates formatted differently could fail to group → Mitigation: group the exact numeric values emitted by the existing normalized metadata readers; do not round distinct coordinates together.
- [Risk] Grouping can accidentally alter map extent → Mitigation: retain the original marker list for bounds calculation.

## Migration Plan

- No data migration or deployment ordering is required; this is a backwards-compatible client rendering change.
- Rollback consists of reverting the map grouping/popup code; existing public marker data and coordinate readers remain unchanged.
