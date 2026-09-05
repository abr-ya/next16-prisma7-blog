## 1. Public Marker Data

- [ ] 1.1 Extend the public hike read path to load the minimum photo fields needed to derive direct-GPS markers (including stored EXIF metadata status/summary and first eligible image asset id).
- [ ] 1.2 Derive a visibility-safe marker view model with photo id, title, lat/lng, and optional thumbnail URL only for published linked photos with successful valid direct EXIF GPS.
- [ ] 1.3 Ensure the client does not receive full photo metadata, provider URLs, extraction errors, or other EXIF fields.
- [ ] 1.4 Keep hike photo gallery ordering and thumbnail/full-access behavior unchanged.

## 2. Hike Map UI

- [ ] 2.1 Extend the hike/Leaflet map composition to accept photo marker points alongside track geometry.
- [ ] 2.2 Render distinct photo markers for each GPS-eligible linked photo.
- [ ] 2.3 Add hover/focus tooltips with photo title and optional visibility-safe thumbnail preview; fall back to title-only when no thumbnail exists.
- [ ] 2.4 Expand map bounds fitting to include both track geometry and photo markers.
- [ ] 2.5 Show the hike map when GPS markers exist even if no mapped tracks are present; omit the map when neither tracks nor markers exist.
- [ ] 2.6 Preserve existing single-track start/end marker behavior when exactly one mapped track is shown.

## 3. Documentation And Validation

- [x] 3.1 Mark `outdoor-photo-gps-map-markers` as In Progress in the outdoor backlog under `feature-060-outdoor-photo-gps-map-markers`.
- [x] 3.2 Run `openspec validate feature-060-outdoor-photo-gps-map-markers --strict`.
- [ ] 3.3 Run `npm run tsc`.
- [ ] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 3.5 Ask the user to run `npm run build` locally and confirm the result.
- [ ] 3.6 Manually check `/hikes/[slug]` for tracks+GPS photos, GPS-only, tracks-only, and neither; confirm tooltips stay visibility-safe.
