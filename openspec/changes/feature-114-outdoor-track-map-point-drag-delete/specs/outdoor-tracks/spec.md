# Spec Delta

## ADDED Requirements

### Requirement: Place on map tab lets the viewer move and remove individual points on the map

The system SHALL let a viewer move an already-placed point to a new coordinate by dragging it on the map, and SHALL let a viewer remove a placed point by clicking it to select it and then pressing `Delete` or `Backspace`. The system SHALL render every placed point as a draggable map marker (round dot, teal by default) using `react-leaflet`'s built-in `Marker` drag. On `dragend`, the system SHALL update the point's `lat` and `lng` to the new coordinate and SHALL leave the point's index in the `points` array unchanged (drag is a position correction, not a reorder). The system SHALL select a point when the viewer clicks it; only one point is selected at a time, and the selected point renders in a contrasting color (orange) and slightly larger size. The system SHALL remove the selected point and clear the selection when the viewer presses `Delete` or `Backspace` while the event target is not an `<input>`, `<textarea>`, or `[contenteditable]`. The system SHALL stop event propagation in the marker click handler so the existing `ClickToAdd` does not also fire (and shall not add a duplicate point at the same coordinate).

#### Scenario: Dragging a point updates its coordinate but not its order

- **WHEN** a viewer presses a placed point on the map, drags it to a new coordinate, and releases
- **THEN** the system updates the point's `lat` and `lng` to the new coordinate
- **AND** the point's index in the `points` array is unchanged
- **AND** the dashed polyline through all points redraws through the new coordinate
- **AND** the side-list row for that point still shows the same numeric index

#### Scenario: Clicking a point selects it and changes its visual

- **WHEN** a viewer clicks a placed point on the map
- **THEN** the system marks the point as selected (visual: orange color, slightly larger size, `aria-label` of the form "Selected point N. Press Delete to remove.")
- **AND** any previously selected point is deselected
- **AND** no duplicate point is added at the same coordinate (the `ClickToAdd` handler does not fire)

#### Scenario: Delete removes the selected point

- **WHEN** a viewer has a point selected and presses `Delete`
- **THEN** the system removes the point from the `points` array
- **AND** the system clears the selection
- **AND** the dashed polyline redraws through the remaining points
- **AND** the side list renumbers the remaining rows

#### Scenario: Backspace removes the selected point

- **WHEN** a viewer has a point selected and presses `Backspace`
- **THEN** the system removes the point and clears the selection (same behavior as `Delete`)

#### Scenario: Typing in any form input does not delete a selected point

- **WHEN** a viewer has a point selected and types any character (including the letters `d`, `e`, `l`, `t`) into a form input on the dialog (title, slug, description, activity type, recording start, recording timezone, duration, status)
- **THEN** the system does not delete the selected point
- **AND** the selection persists until the viewer explicitly clicks empty map or another point, or presses `Delete`/`Backspace` while focus is outside a form input

#### Scenario: Clicking empty map clears the selection and adds a new point

- **WHEN** a viewer has a point selected and clicks an empty area of the map (not on a placed point)
- **THEN** the system clears the selection
- **AND** the system appends a new point at the clicked coordinate (existing `ClickToAdd` behavior, unchanged)

#### Scenario: Side-list remove and reorder still work

- **WHEN** a viewer uses the existing side-list `Trash2` button or the up/down reorder buttons
- **THEN** the system removes or reorders the point (existing behavior, unchanged)
- **AND** if a removed point was the selected point, the system clears the selection

### Requirement: Marker render switches from `CircleMarker` to `Marker` with a `divIcon`

The system SHALL render every placed point on the `Place on map` editor map as a `react-leaflet` `<Marker>` (not `<CircleMarker>`) with a `L.divIcon` round-dot icon that visually matches the previous `CircleMarker` (same approximate size, same teal `#0f766e` color for the unselected state, orange `#ea580c` and slightly larger for the selected state). The system SHALL mirror the in-repo `createEndpointIcon` pattern from `components/track-pages/track-map-leaflet.tsx:20-31` for the `divIcon` HTML so the editor and the public track map share the same visual building block.

#### Scenario: Unselected and selected markers are visually distinct

- **WHEN** a viewer looks at the editor map with no point selected
- **THEN** every placed point renders as a teal round dot of the default size
- **WHEN** a viewer clicks a point
- **THEN** that point renders as an orange round dot, visibly larger than the unselected dots, and the other points stay teal
- **WHEN** the viewer clicks another point or empty map
- **THEN** the highlight moves or clears, and no point stays in the selected color after the click resolves

### Requirement: No schema, server-action, or display-surface change in this slice

The system SHALL NOT add new schema columns, new enums, or migrate existing data. The system SHALL NOT change the signature of `CreateManualTrackInput`, `createManualTrack`, `createTrack`, or `parseTrackGpx`. The system SHALL NOT change the public track map, public track list, public track detail, admin track list, or hike linked-track card render path. The new affordances are scoped to the editor map widget inside `TrackFormDialog` and are session-local mutations of the existing `points` state that already participates in the dirty-close guard and the existing `placedPoints` submit payload.
