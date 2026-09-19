## 1. Map-to-gallery selection

- [ ] 1.1 Add a photo-ID selection callback from the Leaflet photo marker popup through the trip map to the trip media boundary.
- [ ] 1.2 Make single and grouped marker photo entries selectable while preserving their current visibility-safe titles and thumbnails.
- [ ] 1.3 Open the existing gallery lightbox at the selected photo for authenticated viewers; show clear sign-in guidance to guests without requesting full media.

## 2. Verification and tracking

- [ ] 2.1 Mark the P0 candidate In Progress as `feature-084-outdoor-trip-map-photo-lightbox` in the backlog.
- [ ] 2.2 Run `npm run tsc`, targeted ESLint for changed map/gallery files, and `npm run lint` for changed app files.
- [ ] 2.3 Ask the user to run `npm run build` locally and manually verify a single marker, grouped colocated markers, authenticated lightbox opening, and guest sign-in guidance.
