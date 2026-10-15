# Proposal

## Why

After feature-111, a verified/trusted owner can place points on a map through the `Place on map` tab inside `TrackFormDialog`. Adding a point is a single click anywhere on the map. Removing a point, however, requires the user to move their eye off the map to the side list and click the per-point `Trash2` button; reordering is similarly list-only via the up/down buttons. There is no way to **move** an already-placed point to a new coordinate at all — `CircleMarker` (the current renderer) does not support `draggable`, and there is no hand-rolled drag handler. As a result, placing the wrong spot means deleting the point and clicking again, and adjusting a route to follow a real trail means redoing the whole sequence.

This change adds two mouse-driven affordances to the existing `Place on map` map widget: (a) drag an existing point to a new coordinate, and (b) click a point to select it, then press `Delete` or `Backspace` to remove it. Both keep the existing side-list controls working unchanged and require no new schema columns, no new server action, and no change to the public/admin display surfaces.

## What Changes

- Switch the editor map's per-point render from `react-leaflet`'s `<CircleMarker>` to `<Marker>` with a `L.divIcon` round-dot, mirroring the in-repo `createEndpointIcon` pattern in `components/track-pages/track-map-leaflet.tsx:20-31` so the editor keeps the same look as the public track map.
- Add `draggable: true` to every editor point. On `dragend` (Leaflet built-in marker drag, not hand-rolled), call a new `onMovePoint(index, { lat, lng })` callback that updates the point's coordinates in place; the point's index in the array does not change, so the polyline order stays correct.
- Add a click handler to every editor point. On click, set a `selectedIndex` in the editor shell, stop event propagation so the existing `ClickToAdd` does not also fire (this incidentally fixes an existing duplicate-on-click-of-existing-point bug for the new render path), and visually highlight the selected point with a different color/size.
- Add a window `keydown` listener in the editor shell. When `selectedIndex` is non-null and the pressed key is `Delete` or `Backspace`, call the existing `handleRemovePoint(index)` (already wired to the side-list `Trash2` button) and clear `selectedIndex`.
- Reuse the existing dirty-close guard: drag/select/delete on the map are session-local mutations of the same `points` state that already participates in the guard, so no new dirty-bit wiring is needed.
- Add a localized `aria-label` for the selected-point state for screen readers (e.g. "Selected point N. Press Delete to remove.").

## Non-Goals

- Not changing the public track map, public track list, public track detail, admin track list, or hike linked-track card — this slice is editor-only.
- Not introducing a stable per-point `id` field; selection and drag are keyed by array index, which is sufficient because the editor's `points` array is session-local and never persisted until submit.
- Not adding multi-select, lasso-select, or bulk-remove.
- Not adding an "undo last action" stack.
- Not adding right-click context menus, hover `×` overlays, or other on-map delete affordances (click-select + `Delete`/`Backspace` is the only delete UX in this slice; the side-list `Trash2` button keeps working as before).
- Not adding touch/long-press behavior beyond what Leaflet's marker drag already does on touch devices.
- Not changing the per-tab `ClickToAdd` "click on empty map to append a point" behavior for the `Upload GPX` tab; the change is scoped to the editor map widget used only by the `Place on map` tab.
- Not changing the existing `TrackEditor` `renderExtraActions?` slot — that slot's reserved "outdoor-track-point-deletion" comment refers to the larger roadmap candidate (edit an existing track, speed chart, drag-range selection, GPX rewrite), which stays on the roadmap and is **not** closed by this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: extends the `Place on map` editor map widget with drag-to-move and click-select-then-`Delete`/`Backspace`-to-remove for individual points; fixes the existing duplicate-point-on-click-of-existing-point side effect of the current `CircleMarker` render by switching to `Marker` (which does not bubble `click` to the map by default).

## Impact

- **Schemas**: none. No Prisma migration; no new columns or enums.
- **APIs**: none. `CreateManualTrackInput`, `createManualTrack`, and the existing `createTrack` / `parseTrackGpx` flows are unchanged. The shape of the `points` array passed to the server action is the same `{ lat: number; lng: number }[]` it has been since feature-111.
- **Code**
  - **Modified**: `components/track-pages/track-editor-map.tsx` — switch per-point render from `<CircleMarker>` to `<Marker>` with a `divIcon` round-dot (in-repo precedent: `createEndpointIcon` in `components/track-pages/track-map-leaflet.tsx:20-31`); add `draggable: true`; add `eventHandlers.dragend` → new `onMovePoint(index, latlng)` prop; add `eventHandlers.click` → new `onSelectPoint(index)` prop with `L.DomEvent.stopPropagation`; thread `selectedIndex` to render the selected point in a different color/size.
  - **Modified**: `components/track-pages/track-editor.tsx` — add `selectedIndex` state; add `onMovePoint` and `onSelectPoint` handlers that funnel into the existing `replacePoints` setter; add a `useEffect`-installed window `keydown` listener that calls the existing `handleRemovePoint(index)` on `Delete`/`Backspace` and clears `selectedIndex`; clean up the listener on unmount; pass `selectedIndex` to `TrackEditorMap`.
  - **Modified**: `app/i18n/locales/{en,ru}/trips.json` — one new `trackEditorMapSelectedPointAria` key (screen-reader announcement of selected state).
- **Dependencies**: none. `leaflet`, `react-leaflet`, and `@types/leaflet` are already installed (verified in `package.json`); no new package.
- **Localization**: a single new aria-label key per locale.
- **Spec**: delta at `openspec/changes/feature-114-outdoor-track-map-point-drag-delete/specs/outdoor-tracks/spec.md` extending the `outdoor-tracks` capability with the new on-map affordance.
