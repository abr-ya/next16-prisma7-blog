# Design

## Context

After feature-111, the `Place on map` tab inside `TrackFormDialog` (`components/admin-pages/tracks-admin-panel.tsx:188`) renders a `TrackEditor` shell (`components/track-pages/track-editor.tsx:89`) which mounts a `TrackEditorMap` widget (`components/track-pages/track-editor-map.tsx:78`). The widget is Leaflet 1.9.4 + react-leaflet 5.0.0 (verified in `package.json` and `node_modules`), tile layer is OpenStreetMap, and the widget is `dynamic(..., { ssr: false })`-loaded because Leaflet touches `window` at module init.

The widget currently:
- Renders the map (`MapContainer`), the OSM tile layer, a `ClickToAdd` handler that uses `useMapEvents({ click })` to append `{ lat, lng }` to the points array, and a dashed `Polyline` through all points.
- Renders each point as a `react-leaflet` `<CircleMarker>` with `key={index}`, radius 6, color `#0f766e`, and **no `eventHandlers`** — Leaflet's `Path` defaults (`interactive: true`, `bubblingMouseEvents: true`) mean a click on a placed dot bubbles to the map's `click` handler, which appends a new duplicate point at the same coordinates (an existing UX bug).

The shell currently:
- Owns the points array as plain `useState<ManualTrackPoint[]>` (where `ManualTrackPoint = { lat: number; lng: number }`, defined at `track-editor.tsx:28` and duplicated at `app/_data/tracks.ts:58`).
- Exposes a `replacePoints` setter that is the single funnel for state changes (`:99-105`).
- Exposes `handleAddPoint` (`:107-112`), `handleRemovePoint` (`:114-119`), and `handleMovePoint` (`:121-131`); the third is an **array reorder** (up/down), not a coordinate move, and is invoked by the side-list up/down buttons.
- Renders a side-list with a `Trash2` per-point remove button (`:200-208`, localized via `t("trackEditorRemovePoint")`) and the up/down reorder buttons.

The existing `TrackEditorMap` props are `points: TrackEditorMapPoint[]` (= `TrackGpxCoordinate` = `{ lat, lng }`, from `lib/track-gpx-metadata.ts:16-19`) and `onAddPoint: (point) => void`. There is no callback today for edit, remove, or select.

The map is a **create-only** surface: the tab row is not rendered in the edit dialog (`!isEditing` at `tracks-admin-panel.tsx:692`), and `initialPoints={[]}` is hardcoded on the editor mount (`:788`). "Existing points" throughout this slice means points placed in the current session, not previously-saved track geometry.

## Goals / Non-Goals

**Goals**

- Let the viewer move an already-placed point to a new coordinate by dragging it on the map (no side-list detour).
- Let the viewer delete a placed point by clicking it (to select) and pressing `Delete` or `Backspace`.
- Keep the side-list `Trash2` button and up/down reorder buttons working unchanged.
- Keep the polyline order intact when a point is moved (move does not reorder; only coordinates change).
- Keep the existing dirty-close guard, `canSubmit` minimum (`points.length >= 2`), and the rest of `TrackFormDialog` unchanged.
- Fix the existing duplicate-on-click-of-existing-point bug as a side effect of the render change.

**Non-Goals**

- No edit dialog (the editor is create-only; editing previously-saved points stays out of scope).
- No `id` field on `ManualTrackPoint`; selection and drag are indexed.
- No multi-select, lasso, undo/redo, or right-click context menu.
- No new schema columns, no new server-action signature change.
- No display-surface change (public track map, public list, public detail, admin list, hike linked-track card all keep their current render path).
- No new dependency; `react-leaflet`'s built-in marker drag is sufficient.
- No browser-level testing infrastructure (project has none per `CLAUDE.md`); verification is `npm run tsc` / `npm run lint` / `npm run build` plus a single happy-path browser check.

## Decisions

### 1. Switch per-point render from `CircleMarker` to `Marker` with a `divIcon`

**Decision**: Each placed point in `TrackEditorMap` renders as a `react-leaflet` `<Marker>` with a `L.divIcon` round-dot (HTML div, small filled circle, same color as today's `CircleMarker`). The `divIcon` mirrors the in-repo `createEndpointIcon` helper at `components/track-pages/track-map-leaflet.tsx:20-31`, which already produces a styled round endpoint marker for the public track map.

**Why**: `CircleMarker` extends `Path` and Leaflet's `Path` has no `draggable` option (verified in `node_modules/@types/leaflet/index.d.ts:2082-2086` and the `MarkerOptions.draggable?: boolean` declaration at `:3042-3043`). `Marker`, by contrast, supports `draggable: true` and the `eventHandlers.dragstart` / `drag` / `dragend` callbacks out of the box. Switching the renderer is the smallest path to a working drag; hand-rolling drag on `CircleMarker` would require a custom mousedown / mousemove / mouseup layer with `map.latLngToContainerPoint` math and would have no in-repo precedent. The `divIcon` keeps the visual identical to today's `CircleMarker` (round filled dot, same color, similar size) so the only user-visible change is the new interaction.

**Alternatives considered**

- *Keep `CircleMarker` and hand-roll drag*: rejected — no in-repo precedent, ~150 LOC, easy to get stuck to an already-moving map during a drag, harder to get accessible focus order right.
- *Use `L.LayerGroup` of `CircleMarker` with a custom `mousedown` listener on the map and a `setLatLng` callback*: rejected — same complexity, no in-repo precedent, and the manual `latLngToContainerPoint` math breaks under map zoom during a drag.

### 2. Drag is in-place coordinate update; array order is preserved

**Decision**: The new `onMovePoint(index, { lat, lng })` callback updates the `lat` and `lng` of the point at `index` and leaves the point's position in the array unchanged. The `Polyline` through all points re-renders naturally because it reads from the same `points` array.

**Why**: A drag is a position correction, not a reorder. If drag reorders, the route's narrative order would change when the user only meant to nudge a single point, which is surprising. Keeping the index stable also means the side-list numbering stays consistent with the map during a drag.

**Alternatives considered**

- *Drag reorders (insert the dragged point's old spot at the new spot)*: rejected — couples move and reorder in a way most map editors do not, and surprises users who expect "drag = move, list buttons = reorder".

### 3. Click-to-select + `Delete`/`Backspace` is the only on-map delete affordance

**Decision**: Clicking a placed point sets `selectedIndex` to that point's index. The selected point renders in a different color (orange `#ea580c`) and slightly larger size. A window `keydown` listener (installed by `useEffect` on mount, cleaned up on unmount) calls `handleRemovePoint(selectedIndex)` and clears `selectedIndex` when the pressed key is `Delete` or `Backspace`. The existing side-list `Trash2` button continues to work and is the only way to delete a point on touch devices without a keyboard.

**Why**: This is the standard pattern in web map editors (Google My Maps, Mapbox Studio, uMap) and matches the user's chosen UX option. It is mouse-driven for the click, mouse-driven for the visual confirmation (selected point highlights), and uses a single keypress for the destructive action — discoverable through trial and error and through the side-list `Trash2` button that already exists. The orange highlight is unambiguous (the route is teal `#0f766e` everywhere; the selected dot is orange).

**Alternatives considered**

- *Right-click context menu*: rejected as the only affordance — undiscoverable without a tooltip, and a menu adds DOM and an extra click.
- *Hover `×` overlay*: rejected — adds an overlay per marker, requires a small CSS hover state, harder to keep accessible (focus order, screen-reader announcement).
- *Per-marker small `×` always visible*: rejected — visually noisy, would overlap the polyline, and is unnecessary given the click-select UX.

### 4. `selectedIndex` is a single number, not a set

**Decision**: `selectedIndex: number | null`. At most one point is selected at a time. Clicking another point moves the selection; clicking empty map (the existing `ClickToAdd` path) adds a new point and clears the selection; pressing `Delete`/`Backspace` deletes the selected point and clears the selection.

**Why**: A single-selection model is the simplest UX and matches the destructive-action semantics (`Delete` removes exactly one point). Multi-select would require a different keybinding (`Shift+Delete` or similar), a multi-select visual, and a list-aware `handleRemovePoint` extension; none of that earns its place in this slice.

**Alternatives considered**

- *Multi-select with `Shift+click` and a `selected: Set<number>`*: deferred — the user can always repeat click + `Delete` per point, and the slice is small.

### 5. Stop event propagation in the marker click handler

**Decision**: The marker `eventHandlers.click` calls `L.DomEvent.stopPropagation(e.originalEvent)` (or the equivalent react-leaflet pattern) before invoking the `onSelectPoint` callback.

**Why**: `CircleMarker` is a `Path` whose `bubblingMouseEvents` default is `true`; that is the root cause of the existing duplicate-on-click-of-existing-point bug. `Marker` does not bubble `click` to the map by default, so the bug should not reappear with the new render. The explicit `stopPropagation` is belt-and-suspenders: it documents the intent and protects against any future Leaflet version change.

**Alternatives considered**

- *Rely on Marker's default non-bubbling*: rejected as the only measure — the explicit `stopPropagation` is one line and removes ambiguity.

### 6. `useEffect`-installed `keydown` listener, not `onKeyDown` on the map container

**Decision**: The `Delete`/`Backspace` listener is installed with `window.addEventListener("keydown", handler)` from a `useEffect` inside `TrackEditor` and removed in the cleanup function. The handler is a no-op when `selectedIndex === null` or when the key is anything other than `Delete`/`Backspace`. The handler also no-ops when the event target is a form input (`<input>`, `<textarea>`, `[contenteditable]`) so typing the word "delete" in a slug field or the duration fields does not delete a map point.

**Why**: A window-level listener catches the keypress regardless of focus (the marker is an SVG element inside a Leaflet pane and is not focusable by default, so an `onKeyDown` on the marker would not fire). The `isEditingText` guard prevents accidental deletes while the user is typing in any of the four new form fields (activity-type select, recording-start datetime, recording-timezone, duration) or the existing title/slug/description/status inputs.

**Alternatives considered**

- *Per-marker `tabIndex` + `onKeyDown` on the marker*: rejected — requires non-trivial Leaflet/DOM wiring to make SVG markers focusable, and the keypress target is brittle across browsers.
- *No `isEditingText` guard*: rejected — would silently delete a selected point when the user types "delete" in the slug field while a point happens to be selected.

### 7. Reuse the existing `replacePoints` funnel; no new editor state beyond `selectedIndex`

**Decision**: `TrackEditor` gains exactly one new piece of state — `selectedIndex: number | null` — and three new handlers (`onMovePoint`, `onSelectPoint`, `onKeyDown`). Every existing handler (`handleAddPoint`, `handleRemovePoint`, `handleMovePoint` for reorder) is reused unchanged; the new handlers funnel into `replacePoints`. No new prop is added to the `TrackEditor` consumer; the editor's external API stays `(initialPoints, onChangePoints, renderFormFields, mapAriaLabel)`.

**Why**: The editor's `replacePoints` is the single funnel feature-111 established; routing the new mutations through it keeps the dirty-close guard, the `onChangePoints` mirror in `TrackFormDialog`, and the `placedPoints` submit payload all working without any wiring change. Adding new top-level state beyond `selectedIndex` would be a smell.

**Alternatives considered**

- *Introduce a reducer (`useReducer`) for points*: deferred — the existing two-level `useState` is small and the new `selectedIndex` does not interact with the points array, so a reducer would be premature.

### 8. No new `id` field; selection and drag are indexed

**Decision**: `ManualTrackPoint` stays `{ lat: number; lng: number }`. Selection and drag use the array index. After a drag, the index is unchanged, so the identity of a "selected" point is preserved across the drag (no need to recompute `selectedIndex` after `onMovePoint`).

**Why**: The editor's `points` array is session-local and never persisted until submit; the only consumer of the index is the editor itself. A stable `id` would survive only this one session, so the cost (every `onMovePoint`, `onAddPoint`, `onRemovePoint`, `onSelectPoint` updating an id) outweighs the benefit. The duplicate `ManualTrackPoint` declaration in `app/_data/tracks.ts:58` is also left untouched in this slice.

**Alternatives considered**

- *Add a `clientId: string` to `ManualTrackPoint` and use it for keys/selection*: deferred — index is sufficient for this slice; revisit if a future slice introduces session-resume or undo/redo.

## Risks / Trade-offs

- **[Risk]** A drag that ends very close to a mousedown can fire a `click` after `dragend`, which could race with the existing `ClickToAdd` and produce a spurious extra point. **Mitigation**: Leaflet's `Marker` distinguishes drag (above-distance-threshold) from click (below-threshold) and fires exactly one of `dragend` or `click` per gesture; the explicit `stopPropagation` in the marker click handler is a backstop. Add a browser-check item for "drag a point to a new spot and confirm no extra point is added".
- **[Risk]** The `Marker` z-order differs from `CircleMarker`'s, so selected-point highlight may stack under a polyline junction. **Mitigation**: set `zIndexOffset` on the selected marker (e.g. `1000`) so it renders above the polyline. Add a browser-check item for "selected point stays visible when overlapping the polyline".
- **[Risk]** Switching from `CircleMarker` to `Marker` changes the SVG element from `<path>` to `<img>`/`<div>`, which can change screenshot tests or visual diffs in the future. **Mitigation**: the project has no screenshot tests today; the only visual contract is "round dot of the same color and approximate size", which the `divIcon` honors.
- **[Risk]** The window `keydown` listener fires while the user is typing in any of the dialog's inputs (title, slug, description, activity type, recording start, recording timezone, duration, status). **Mitigation**: the `isEditingText` guard no-ops the handler when the event target is an `<input>`, `<textarea>`, or `[contenteditable]`.
- **[Risk]** The `trackEditorMapSelectedPointAria` key may not currently resolve because `track-editor.tsx:96` uses `useT(navigationNamespace)` while all `trackEditor*` keys live in `trips.json` (pre-existing bug in the editor shell). **Mitigation**: place the new key in `trips.json` (same namespace as the existing `trackEditor*` keys) and let the existing fallback chain handle it; if a future slice fixes the namespace, this key moves with the others.
- **[Risk]** Dragging a point far from the current map view can move it outside the visible bounds, making "where did my point go?" hard to debug. **Mitigation**: the editor's existing `MapContainer` re-fits bounds on every render (`:87-98`), so the view follows the new point position after the drag settles. No auto-pan during drag (would be surprising).

## Migration Plan

1. Land the two-component change in one PR (the slice's tasks split this into reviewable steps but ships together):
   - `components/track-pages/track-editor-map.tsx`: switch `CircleMarker` → `Marker` + `divIcon`; add `draggable`, `eventHandlers.dragend` (`onMovePoint`), `eventHandlers.click` (`onSelectPoint` + `stopPropagation`); thread `selectedIndex` for the highlight render.
   - `components/track-pages/track-editor.tsx`: add `selectedIndex` state, the three new handlers, and the `useEffect` window `keydown` listener with `isEditingText` guard.
   - `app/i18n/locales/{en,ru}/trips.json`: one new `trackEditorMapSelectedPointAria` key.
2. Validation: `npm run tsc`, `npm run lint`, `npm run build` (per `CLAUDE.md` § Validation Workflow).
3. Browser-check the happy path as a verified user on `/my/tracks` and `/admin/tracks`:
   - Place 3 points via `Click on empty map`.
   - Drag point 2 to a new coordinate; confirm the point moves, the polyline redraws through the new spot, and the index does not change (the side list still shows the same number in each row).
   - Click point 2 to select; confirm the highlight color/size change; press `Delete`; confirm the point disappears, the polyline redraws without it, and the side-list numbering updates.
   - Click a placed point; type "delete" in the title field; confirm no point is deleted (the `isEditingText` guard).
   - Confirm the existing side-list `Trash2` button and up/down reorder buttons still work.
4. Rollback: revert the PR. No schema to roll back, no data migration to revert. The side-list `Trash2` button and `ClickToAdd` still work after a partial rollback to the `CircleMarker` render (drag/select become unavailable, but the existing UX is preserved).

## Open Questions

None for this slice. The follow-up candidates that may want a similar editor affordance (e.g. editing a previously-saved track on the admin edit dialog) are tracked separately on the roadmap as `outdoor-track-edit-map` and are explicitly out of scope here.
