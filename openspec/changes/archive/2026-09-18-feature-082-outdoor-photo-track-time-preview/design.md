## Context

The current coordinate-review modal receives server-proposed candidates with an explanation and resolved coordinate, but no source-track geometry or timed points for client-side experimentation. The existing coordinate resolver is pure and can interpolate a coordinate from a serializable timed GPX timeline. See `proposal.md` and the modified map requirement for product scope.

## Goals / Non-Goals

**Goals:**

- Provide a private visual preview for an inside-track candidate at the original capture time and five fixed offsets.
- Keep preview computation instant and local once authorized review data has loaded.
- Make the preview state unmistakably non-persistent.

**Non-Goals:**

- Recompute candidate classes across attached tracks, alter the stored capture time, or let an offset change approval inputs.
- Expose raw GPX files, provider URLs, or private track timelines outside owner-or-admin coordinate review.

## Decisions

### Project only the selected candidate's source-track preview data

Extend the authorized photo-detail projection only for an inside-track candidate with a usable timed timeline. It will include serializable source-track map geometry and timed points needed to draw the compact track fragment and interpolate offsets. Sending all linked track data would broaden the protected payload and is unnecessary for the MVP.

### Keep offsets client-only and bounded

The review component will model offset hours as one of `-3`, `-2`, `-1`, `0`, `1`, `2`, or `3`, derive a preview timestamp from the stored UTC instant, and call the existing pure interpolation helper. This provides immediate feedback without a server action or persistence path. A free-form offset or server-side candidate recomputation would change the review model and belongs to a later feature.

### Reuse the browser-only map path with a review-specific composition

Reuse the existing client-only Leaflet setup and map styling, but compose a compact review map that draws the one authorized source track plus a distinct preview marker. The public trip-map projection remains unchanged because the review map consumes its own protected view model.

### Preserve approval semantics

Existing approval sends the original candidate id and does not receive the offset preview. The UI will label the offset as temporary and retain the original candidate's explanation and approval action. A later feature may explicitly define reviewed time correction if desired.

## Risks / Trade-offs

- [A reviewer may mistake an offset preview for saved metadata] → show the selected signed offset and a clear temporary-preview label; do not place it in the approval payload.
- [Offsets outside the track produce a misleading endpoint] → return an explicit unavailable state rather than using the resolver's endpoint fallback.
- [Timed geometry may enlarge an authorized detail payload] → project only the selected source track and only to the existing owner-or-admin review audience.
- [Map lifecycle in a dialog can be fragile] → reuse the existing client-only Leaflet loading boundary and give the compact map fixed dimensions.

## Migration Plan

No database migration is required. Deploy as an additive protected read projection and client UI. Rollback removes the preview projection and map component while leaving current candidates and persisted coordinate review records unchanged.
