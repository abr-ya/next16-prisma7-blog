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

A hike detail page can render all linked visible tracks together, such as 3-10 GPX tracks for one trip. The map should fit combined bounds across all rendered tracks. Photo markers can be shown at the same time for an initial target of 20-30 photos.

### Photo Markers

Photos can become map markers in two ways:

- Direct GPS EXIF coordinates, when available.
- Time-based matching against GPX track points, when a photo has `capturedAt` metadata and the linked GPX track has timestamped points.

Leaflet handles marker display, popups, and layer toggles. The EXIF extraction and time-to-track matching logic belongs to the application domain, not the map package.

As of `feature-052-outdoor-photos-exif-gps-capture`, outdoor photos store versioned admin-only EXIF/GPS metadata on `Photo.metadata` (`photo-exif-metadata/v1`), including normalized `summary.gps` and `summary.gpsSourceFileAssetId` when coordinates exist. Public gallery pages and public coordinate display remain later slices; hike map markers should read the stored admin metadata rather than reparsing image files at request time.

### Manual Points

Later admin or frontend editing can let users click the map, capture a `lat/lng`, and save manual points such as camps, viewpoints, notes, or custom points of interest. Leaflet supports the click interaction and marker rendering needed for this workflow.

## Performance Notes

The main performance risk is not the number of tracks, but the number of coordinates inside each GPX file. A single GPX file can contain thousands or tens of thousands of points. The GPX parsing slice should therefore store map-ready geometry separately from raw file storage, ideally including a simplified geometry for public map rendering.

Recommended rendering approach:

- Track detail: render one track with richer metadata.
- Hike detail: render multiple polylines, start/end markers, and optional photo markers.
- Dense mode: simplify polylines, hide intermediate point markers, and keep photo markers optional when the map gets crowded.
- Fallback: if parsed geometry is unavailable, show track metadata and GPX download without a map.

## Alternative

MapLibre GL JS remains a good future option if the project needs vector tiles, WebGL rendering, advanced styling, 3D terrain, globe views, or heavier cartographic features. For the first GPX track and hike maps, it is more power than the project needs.
