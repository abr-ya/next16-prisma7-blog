# Outdoor Map Package Notes

This note captures the current map package direction for outdoor tracks, hikes, photos, and later map-based editing.

## Recommendation

Use Leaflet with React Leaflet for the first outdoor map implementation.

Leaflet is a lightweight open-source mapping library with strong support for tile layers, markers, popups, polylines, and mobile-friendly interactions. React Leaflet gives the project a React component layer over Leaflet, which fits the existing Next.js and React component structure. Because React Leaflet is not compatible with server-side rendering, map components should be client-only and loaded with a browser-only boundary in Next.js.

## Why Leaflet Fits

- It is enough for rendering one or more GPX-derived polylines over OpenStreetMap-compatible tiles.
- It supports markers for start/end points, manual points, photo locations, notes, and points of interest.
- It can handle the near-term target of roughly 1-10 tracks and 20-30 photo markers on a hike detail map, assuming GPX geometry is parsed and simplified before rendering.
- It keeps the first map slice simpler than a vector/WebGL map stack.
- It leaves room for layer controls so users can toggle tracks, photo markers, and manual points independently.

## Planned Use Cases

### Track Detail Map

A track detail page can render one GPX-backed polyline, fit the map to its bounds, and optionally show start/end markers. This view can afford more track-specific metadata because it focuses on a single track.

### Hike Detail Map

As of `feature-059-outdoor-hike-combined-track-map`, a published hike detail page renders all linked published tracks with current map-ready geometry in one map under the title and description. The viewport fits the combined stored bounds. A single mapped track keeps start/end markers; multiple tracks render as distinct polylines without per-track start/end markers. Photo markers remain a later slice.

### Photo Markers

Photos can become map markers in two ways:

- Direct GPS EXIF coordinates, when available.
- Time-based matching against GPX track points, when a photo has `capturedAt` metadata and the linked GPX track has timestamped points.

Leaflet handles marker display, popups, and layer toggles. The EXIF extraction and time-to-track matching logic belongs to the application domain, not the map package.

As of `feature-052-outdoor-photos-exif-gps-capture`, outdoor photos store versioned admin-only EXIF/GPS metadata on `Photo.metadata` (`photo-exif-metadata/v1`), including normalized `summary.gps` and `summary.gpsSourceFileAssetId` when coordinates exist. Public gallery pages and public coordinate display remain later slices; hike map markers should read the stored admin metadata rather than reparsing image files at request time.

As of `feature-055-outdoor-hike-photo-association`, hike detail pages can show linked published photos in hike-specific order using public-display-eligible image assets. As of `feature-059-outdoor-hike-combined-track-map`, the hike map shows linked tracks only; photo map markers still belong to later slices that explicitly decide coordinate display, marker popups, and fallback behavior.

### Manual Points

Later admin or frontend editing can let users click the map, capture a `lat/lng`, and save manual points such as camps, viewpoints, notes, or custom points of interest. Leaflet supports the click interaction and marker rendering needed for this workflow.

## Performance Notes

The main performance risk is not the number of tracks, but the number of coordinates inside each GPX file. A single GPX file can contain thousands or tens of thousands of points. The GPX parsing slice should therefore store map-ready geometry separately from raw file storage, ideally including a simplified geometry for public map rendering.

Recommended rendering approach:

- Track detail: render one track with richer metadata.
- Hike detail: render multiple polylines, with start/end markers only when a single mapped track is shown. Photo markers remain a later slice.
- Dense mode: simplify polylines, hide intermediate point markers, and keep photo markers optional when the map gets crowded.
- Fallback: if parsed geometry is unavailable, omit the hike map and keep the linked-track list; track detail still shows metadata and GPX download without a map.

## Alternative

MapLibre GL JS remains a good future option if the project needs vector tiles, WebGL rendering, advanced styling, 3D terrain, globe views, or heavier cartographic features. For the first GPX track and hike maps, it is more power than the project needs.
