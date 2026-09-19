## 1. Map-to-gallery selection

- [x] 1.1 Add a photo-ID selection callback from the Leaflet photo marker popup through the trip map to the trip media boundary.
- [x] 1.2 Make single and grouped marker photo entries selectable while preserving their current visibility-safe titles and thumbnails.
- [x] 1.3 Open the existing gallery lightbox at the selected photo for authenticated viewers; show clear sign-in guidance to guests without requesting full media.

## 2. Verification and tracking

- [x] 2.1 Mark the P0 candidate In Progress as `feature-084-outdoor-trip-map-photo-lightbox` in the backlog.
- [x] 2.2 Run `npm run tsc`, targeted ESLint for changed map/gallery files, and `npm run lint` for changed app files.
- [x] 2.3 Verify `npm run build` locally and manually check a single marker, grouped colocated markers, and authenticated lightbox opening. Done by the user on 2026-09-19 for authenticated viewers; guest sign-in guidance verification deferred to the `outdoor-map-photo-guest-lightbox-manual-qa` backlog candidate.
