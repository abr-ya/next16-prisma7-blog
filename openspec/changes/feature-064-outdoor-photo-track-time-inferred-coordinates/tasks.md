## 1. Track Timed Timeline

- [ ] 1.1 Extend track GPX metadata types/readers with an optional backward-compatible compact timed timeline (`time` + `lat`/`lng` points).
- [ ] 1.2 Update GPX parsing/refresh to downsample and store a bounded timeline when usable per-point timestamps exist.
- [ ] 1.3 Keep existing tracks without timeline readable; treat along-route interpolation as unavailable until reparse.
- [ ] 1.4 Surface enough admin signal that a track has (or lacks) a timed timeline for inference, without requiring public UI changes yet.

## 2. Photo Coordinate Persistence Model

- [ ] 2.1 Define versioned photo metadata fields for inferred/manual map coordinates: lat/lng, source, review status, provenance, confidence/quality, and review timestamps as needed.
- [ ] 2.2 Add readers/writers that remain backward-compatible with photos lacking the new fields.
- [ ] 2.3 Implement pure helpers that turn accepted match candidates + track timeline/endpoints into resolvable lat/lng (inside-window interpolation; between-tracks midpoint when near).
- [ ] 2.4 Refuse to persist inside-window coordinates when no timed timeline exists unless the admin supplies manual lat/lng.

## 3. Admin Review Workflow

- [ ] 3.1 Evolve the feature-061 spike modal from accept→log into approve / reject / optional numeric lat/lng correction with durable server writes.
- [ ] 3.2 Show candidate provenance, track time/timezone evidence, and whether interpolation vs midpoint vs manual override will be used.
- [ ] 3.3 Keep review controls admin-only and limited to photos without direct EXIF GPS that have usable capture time.
- [ ] 3.4 Reflect current review status (pending/approved/rejected) in the admin hike/photo UI after save.

## 4. Public Map Markers

- [ ] 4.1 Update hike photo marker selection to prefer direct EXIF GPS, else approved inferred/manual coordinates, else no marker.
- [ ] 4.2 Ensure approved inferred markers appear on `/hikes/[slug]` with the same visibility-safe tooltip rules as EXIF markers.
- [ ] 4.3 Ensure pending/rejected inferred coordinates never appear on the public map.

## 5. Validation

- [ ] 5.1 Run `openspec validate feature-064-outdoor-photo-track-time-inferred-coordinates --strict`.
- [ ] 5.2 Run `npm run tsc`.
- [ ] 5.3 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 5.4 Ask the user to run `npm run build` locally if routes/metadata/public map behavior changed.
- [ ] 5.5 Manually verify: inside-window approve→marker, between-tracks approve→marker, reject→no marker, direct GPS precedence, track without timeline cannot fake along-route coords, guest cannot access review controls.
