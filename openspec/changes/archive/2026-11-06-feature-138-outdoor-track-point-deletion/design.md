# Design

## Context

A track's geometry lives in its GPX `FileAsset`; `Track.metadata` only keeps a simplified copy (max 1000 coordinates, max 400 timed points, no elevation). The full point list is produced by the module-private `parseGpxPoints` in `lib/track-gpx-parser.ts`. `resolveTrackGeometry` decides whether a track owns its file or borrows the route's, and `parseTrackGpx` rejects route-based tracks by design.

The closest write precedent is `updateRoute` in `app/_data/routes.ts`: it validates and uploads a new GPX through `UTApi.uploadFiles`, creates a new `FileAsset`, swaps the owner's `fileAssetId` and metadata in one transaction, retires the previous asset as `PENDING_DELETE`, and revalidates both routes and tracks. `createRouteFromPoints` shows the same upload-first ordering.

The create-time editor (`track-editor.tsx` / `track-editor-map.tsx`) is session-local and renders one draggable marker per placed point; it cannot carry a 100k-point saved GPX. Reuse its interaction ideas, not its data model.

## Goals / Non-Goals

**Goals:**

- Let the owner remove bad points from a saved, self-owned GPX track without losing elevation, timestamps, or vendor extensions.
- Keep the client payload bounded regardless of GPX size while still deleting against the true full point list.
- Leave a lifecycle-safe file swap: new asset attached, old asset retired, metadata re-parsed from the same bytes.

**Non-Goals:**

- Auto-detection, undo/redo, preview-diff, map drag-range, mobile Sheet.
- Revision backup or restore.
- Editing route-based geometry, trips, workouts-only shortcuts, or other users' tracks.

## Decisions

**Full parse stays on the server; the modal gets a sampled view.** `parseGpxPoints` becomes an exported helper (or is wrapped by a new `parseGpxEditablePoints`). The loader parses the whole GPX once, derives a stable ordinal index for every point, and returns at most `MAX_EDITOR_POINTS = 2000` evenly sampled points, always including the first and last. Each returned point carries `{ index, lat, lng, ele?, time?, speedMps? }`; the full list never crosses the network. A 2000-point payload stays around a couple hundred kilobytes, while the deletion mask still addresses real full-list indices. Sampling also forces in flagged outliers: a point whose detour around the line between its neighbours exceeds `SUSPICIOUS_EXTRA_METERS = 100` and whose deviation exceeds `SUSPICIOUS_DEVIATION_METERS = 50` is always included (with its next point), up to `MAX_SUSPICIOUS_POINTS = 1000`. Without this, uniform sampling would hide the exact spike the owner opened the modal to remove.

**Deletion is expressed as full-index ranges plus click expansion.** The client sends `{ ranges: [{ startIndex, endIndex }], clickedIndices: number[] }`. The server re-fetches and re-parses the file, marks range members directly, and expands each clicked index to full points within `CLEANUP_POINT_RADIUS_METERS = 15` and `CLEANUP_TIME_WINDOW_SECONDS = 10`. The time window is skipped when either point lacks a timestamp. This is the "radius + time-aware filtering against the full point list" from the backlog, and it keeps hidden points between sampled markers in scope.

**Rewrite by splicing the original XML, not by re-serializing.** A new `lib/track-gpx-edit.ts` scans the stored content for `<trkpt …>…</trkpt>` and self-closing `<trkpt …/>` elements, records their byte spans, and removes the spans whose ordinal is in the deletion mask. Everything else — `<ele>`, `<time>`, namespaces, extensions, metadata — stays byte-identical. Re-serializing from parsed points was rejected because the builder in `lib/track-synthetic-gpx.ts` emits only lat/lng and would silently destroy elevation and time.

**Speed is derived, never persisted.** `speedMps` is computed from Haversine distance and consecutive timestamps for the sampled view only. Missing or non-positive time deltas yield `null`, which disables the chart and time-window expansion. The chart deliberately does not clamp outliers: the outliers are what the owner is trying to find.

**Save mirrors the route rewrite.** A new `cleanTrackPoints` action performs: owner-scoped lookup with `where: { id, userId }`, rejection when `routeId` is set, trust gate `requireTrustGatedAction("track-upload")` because a new file is uploaded, file fetch, full parse, mask build, minimum-two-points check, XML splice, `validateGpxString`, upload, then one `$transaction` that creates the new `FileAsset`, updates `Track.fileAssetId`, writes metadata parsed from the same bytes, and retires the old asset `PENDING_DELETE` with `deletedAt`. Revalidation reuses `lib/track-revalidation.ts` and the track detail path.

**Concurrency uses the file identity as a precondition.** The loader returns `fileAssetId`; the save rejects when the current track's `fileAssetId` differs. This prevents two tabs, or a running re-parse, from overwriting a file the owner never saw. A full optimistic-lock column is out of scope.

**Entry and access live on the public page.** `app/(public)/tracks/[slug]/page.tsx` reads `authSession()` (non-redirecting) and calls `getPublicTrackBySlug(slug, viewerId?)`. The data helper computes `canCleanPoints` as owner && `routeId === null` && a `TRACK_GPX`/`ACTIVE` file asset. No user id is returned to the client. The button renders only when `canCleanPoints` is true; the action re-checks the same conditions and never trusts the flag.

**Modal layout.** A `DialogContent` at `sm:max-w-5xl` uses `max-h-[calc(100dvh-2rem)]` with a flex column: the header and footer stay fixed and only the body scrolls, so Save never leaves the viewport. The map is a read-only polyline with markers for sampled points; the speed chart is a Recharts `LineChart` with `Brush` for range selection and `onClick` for single-point selection. Clicking a map marker selects that sampled point; the chart and map share the selection model. A visually hidden table mirrors the chart values for screen readers, following `workout-week-day-charts.tsx`. The mobile Sheet is deliberately a separate candidate.

**Selection is a two-click range plus a typed range.** One click selects a single point; the save expands it by radius/time. A second click closes a contiguous range between the two clicked points and fills the From/To fields with their full GPX point numbers; a third click starts a new selection. The same fields accept typed numbers, and the chart `Brush` produces the same range. Overlapping and adjacent ranges are normalized before rendering and sending. The chart x-axis and tooltip label full GPX point numbers so typed numbers and chart labels agree. The footer shows the selected sampled count, and Save is disabled at zero.

**Distance preview stays client-side and approximate.** Each sampled point carries `distanceFromStartMeters` computed along the full point list. The estimate subtracts the selected span and adds the direct segment that reconnects its neighbours, then the dialog labels it with `≈`. This is instant and needs no extra parse; the saved track's re-parsed summary replaces it with the exact value. A server preview action was rejected because it would re-fetch and re-parse up to 16 MB on every selection change.

**File names keep their original base.** The rewritten upload reuses the track's current `FileAsset.name`, strips the `.gpx` extension and any trailing `(YYYY-MM-DD)` or `(YYYY-MM-DD_HHmmss)` suffix, then appends one `(YYYY-MM-DD_HHmmss)` timestamp. The timestamp is formatted in the track's `recordingTimezone` (UTC when unset or invalid), matching the clock the rest of the track uses. This preserves names such as `Morning run 2026-10-01.gpx` while keeping two saves distinguishable and making repeated cleanups replace the previous suffix instead of growing chains.

## Risks / Trade-offs

- The initial load parses the full GPX (up to 16 MB) and the save parses it again. That is acceptable for an owner-only action, but it is CPU-bound; the loader should fail with a clear message rather than hang if the file is unreadable.
- XML splicing depends on the same tag syntax `parseGpxPoints` accepts. If a file uses an unexpected element form, the helper must refuse to rewrite instead of guessing, leaving the track unchanged.
- Upload-first ordering can orphan an uploaded object if the transaction fails. The route precedent accepts this; the error path reports failure and the track keeps its old file.
- Concurrent edits are rejected only through `fileAssetId`; base metadata edits can still race, and improving that is a broader optimistic-lock concern.
- Route-based tracks are excluded by design. Owners who want to clean those must edit the route, which affects every linked track; that is not offered here.
- A track without timestamps has no chart; selection relies on the map and the point count, which is weaker UX but matches the data.
