## Why

Several hike photos can share the exact coordinate—especially at a campsite or finish point. The current map renders them as overlapping single-photo pins, so only the topmost marker can be discovered; every eligible photo must remain reachable from the public hike map.

## What Changes

- Group public hike photo markers that have identical map coordinates into one discoverable map marker.
- Make a grouped marker visibly communicate its photo count and open an accessible, compact multi-photo popup on click; retain the existing single-photo marker experience for a group of one.
- Render every photo in a group using only its existing visibility-safe title and thumbnail URL, without changing coordinate precedence or photo access rules.

Non-goals:

- No radius-based clustering, spiderfying, day filter, map notes, or map-coordinate data-model changes.
- No changes to direct-EXIF versus approved inferred-coordinate precedence, photo visibility, thumbnail delivery, or signed-in full-photo access.
- No admin map-management surface or manual coordinate editing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Make all linked published photos at a shared map coordinate reachable through a grouped public hike-map marker.

## Impact

- Affected public surface: `/hikes/[slug]` map, including maps that contain photo markers without track geometry.
- Affected code: hike photo marker view-model grouping and the Leaflet marker/popup rendering in `components/track-pages/track-map-leaflet.tsx` (or its focused helper).
- Data/API impact: none; the existing `HikePhotoMapMarker` data remains the source of marker photo content.
