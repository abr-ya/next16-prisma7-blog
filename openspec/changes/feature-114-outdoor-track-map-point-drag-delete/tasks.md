# Tasks

## 1. Switch editor map per-point render to Marker + divIcon

- [ ] 1.1 In `components/track-pages/track-editor-map.tsx`, replace the existing `<CircleMarker>` per-point render with a `<Marker>` whose `icon` is a `L.divIcon` round-dot mirroring the in-repo `createEndpointIcon` pattern in `components/track-pages/track-map-leaflet.tsx:20-31` (same approximate size and teal `#0f766e` color so the visual is unchanged from the user's perspective); verify by `npm run tsc` and by reading the file to confirm `import L from "leaflet"` (or the existing leaflet import) and the `divIcon` class block is in place.
- [ ] 1.2 Add `draggable: true` to every editor `<Marker>`; verify by reading the file and confirming every `Marker` in the editor map receives the prop, and that no other consumer of `TrackEditorMap` is affected (the widget is mounted only by the `Place on map` tab).
- [ ] 1.3 Add `eventHandlers.dragend` to every editor `<Marker>` that calls a new `onMovePoint(index, e.target.getLatLng())` prop with `index` from the render loop and `e.target.getLatLng()` returning a `{ lat, lng }` object; verify by `npm run tsc` and by reading the handler to confirm the index and latlng are forwarded exactly.

## 2. Add click-to-select with stopPropagation

- [ ] 2.1 Add `eventHandlers.click` to every editor `<Marker>` that calls `L.DomEvent.stopPropagation(e.originalEvent)` (or the equivalent react-leaflet-safe stop pattern) and then invokes a new `onSelectPoint(index)` prop; verify by `npm run tsc` and by reading the file to confirm `stopPropagation` runs before the callback and that the callback receives the same `index` used in the render.
- [ ] 2.2 Thread a new `selectedIndex: number | null` prop from `TrackEditorMap` into the marker render: when `selectedIndex === index`, the marker renders with the orange `#ea580c` color and a slightly larger size (e.g. radius 8 instead of 6); verify by `npm run tsc` and by reading the conditional render to confirm the default and selected variants are visually distinct.

## 3. Add `selectedIndex` state + handlers in `TrackEditor`

- [ ] 3.1 Add `const [selectedIndex, setSelectedIndex] = useState<number | null>(null);` to the existing `TrackEditor` shell in `components/track-pages/track-editor.tsx`, next to the existing `points` `useState` (`:97`); verify by `npm run tsc`.
- [ ] 3.2 Add an `onMovePoint` handler that updates the `lat` and `lng` of the point at the given index via the existing `replacePoints` funnel (`:99-105`) and leaves the index unchanged; verify by `npm run tsc` and by reading the handler to confirm it produces a new array reference and the new point's index equals the old point's index.
- [ ] 3.3 Add an `onSelectPoint` handler that sets `selectedIndex` to the given index; verify by `npm run tsc` and by reading the handler to confirm it is a one-line `setSelectedIndex(index)`.
- [ ] 3.4 Pass `selectedIndex`, `onMovePoint`, and `onSelectPoint` into the `TrackEditorMap` render; verify by reading `track-editor.tsx` and confirming the new props are wired into the existing `<TrackEditorMap ... />` call site.

## 4. Add window keydown listener for Delete/Backspace

- [ ] 4.1 Add a `useEffect(() => { ... }, [selectedIndex, points, handleRemovePoint])`-installed `window.addEventListener("keydown", handler)` that, when `selectedIndex !== null` and the pressed key is `Delete` or `Backspace` and the event target is not an `<input>`, `<textarea>`, or `[contenteditable]`, calls the existing `handleRemovePoint(selectedIndex)` and then `setSelectedIndex(null)`; verify by `npm run tsc` and by reading the effect's body and cleanup function.
- [ ] 4.2 Confirm the effect's cleanup function removes the listener on unmount and on dependency change; verify by reading the effect and confirming the `return () => window.removeEventListener("keydown", handler)` line is present and references the same handler function.
- [ ] 4.3 Add a small `isEditingText(target: EventTarget | null): boolean` helper at the top of `track-editor.tsx` (or co-located with the effect) that returns `true` when `target` is an HTMLInputElement, HTMLTextAreaElement, or HTMLElement with `isContentEditable`; verify by `npm run tsc` and by reading the helper to confirm the three cases are covered.

## 5. Localization

- [ ] 5.1 Add a single new `trackEditorMapSelectedPointAria` key to `app/i18n/locales/en/trips.json` with a value like `"Selected point {index}. Press Delete to remove."`; verify by reading the file and confirming the key is in the same namespace as the existing `trackEditor*` keys.
- [ ] 5.2 Add the matching `trackEditorMapSelectedPointAria` key to `app/i18n/locales/ru/trips.json` with a localized value; verify by reading the file and confirming parity with the `en` key.
- [ ] 5.3 Apply the new key to the `aria-label` of the selected marker in `TrackEditorMap` (and only when `selectedIndex === index`); verify by `npm run tsc` and by reading the marker render to confirm the aria-label is present and is a string template that resolves to the key + index.

## 6. Validation

- [ ] 6.1 Run `npm run tsc` and confirm zero errors; record the result in the slice's PR description.
- [ ] 6.2 Run `npm run lint` and confirm zero errors; record the result.
- [ ] 6.3 Run targeted `npx eslint components/track-pages/track-editor-map.tsx components/track-pages/track-editor.tsx --quiet` and confirm zero errors; record the result.
- [ ] 6.4 Run `npm run build` and confirm the build succeeds; record the result.
- [ ] 6.5 Browser-check the happy path on `/my/tracks` and `/admin/tracks` as a verified user: place three points via `Click on empty map`; drag point 2 to a new coordinate and confirm the point moves, the polyline redraws, the side-list index is unchanged, and no spurious extra point is added; click point 2 to select, confirm the highlight changes, press `Delete`, confirm the point disappears and the side list renumbers; type "delete" in the title field with a point selected and confirm no point is deleted (the `isEditingText` guard); confirm the existing side-list `Trash2` button and up/down reorder buttons still work. Record the observations in the PR description.

## 7. Documentation and backlog

- [ ] 7.1 Append a short follow-up to `docs/outdoor-tracks-feature-research-2026-10-07.md` after the existing "Follow-ups from feature-112" section, noting that this slice ships the editor-side drag + click-select + keyboard-delete affordance for points placed in the `Place on map` tab, pointing to this slice's spec/design, and recording that the larger `outdoor-track-point-deletion` candidate (which covers editing existing tracks, speed chart, drag-range selection, and GPX rewrite) is intentionally **not** closed by this slice and stays on the roadmap; verify by reading the doc and confirming the append lands after the feature-112 follow-ups.
- [ ] 7.2 Update `openspec/backlog.md`: confirm no change to the existing `outdoor-track-point-deletion`, `outdoor-track-cleanup-improvements`, `outdoor-track-gpx-revisions`, and `outdoor-trip-owner-draft-track-visibility` candidate rows — all four reference the larger edit-an-existing-track scope that this slice does not cover; verify by `git diff openspec/backlog.md` showing no change in this slice.
