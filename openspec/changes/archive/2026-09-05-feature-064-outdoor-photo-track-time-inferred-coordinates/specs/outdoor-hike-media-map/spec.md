## MODIFIED Requirements

### Requirement: Hike map can place photos with direct GPS coordinates

The system SHALL display linked published photos on the public hike map when those photos have visibility-safe stored direct GPS coordinates from extracted image metadata.

#### Scenario: Linked photo has direct GPS coordinates

- **WHEN** a published hike has a linked published photo with stored direct GPS latitude and longitude from successful EXIF extraction
- **THEN** the public hike map shows a marker for that photo
- **AND** the marker uses stored metadata rather than reparsing the image file

#### Scenario: Linked photo has no direct GPS coordinates

- **WHEN** a published hike has a linked published photo without stored direct GPS coordinates
- **THEN** the photo may still appear in the hike photo section
- **AND** it is not shown as a coordinate marker unless another accepted coordinate source exists

#### Scenario: Linked photo GPS comes from failed or stale extraction

- **WHEN** a linked published photo has missing, failed, or stale EXIF extraction, or its stored GPS summary is absent or invalid
- **THEN** the public hike map does not show a direct-GPS marker for that photo
- **AND** the hike page remains usable
- **AND** an approved inferred or manually corrected coordinate may still provide a marker when present

### Requirement: Photo coordinate inference from track time is planned separately

The system SHALL treat timestamp-based photo-to-track coordinate inference as an explicit reviewed capability. Admins can propose and approve durable inferred or manually corrected coordinates; only approved coordinates without superseding direct EXIF GPS become public hike map markers.

#### Scenario: Photo capture time overlaps track time

- **WHEN** a linked published photo has a stored capture timestamp and a linked published track has a usable recording time range plus a compact timed trackpoint timeline
- **THEN** an admin review flow may propose an inside-track candidate with an interpolated latitude and longitude
- **AND** approving that candidate persists the inferred coordinate for later public use when review status is approved

#### Scenario: Photo capture time falls between nearby tracks

- **WHEN** a linked published photo has a stored capture timestamp that falls between the end of one linked track and the start of another, and those endpoints are within an accepted nearness threshold
- **THEN** an admin review flow may propose a between-tracks candidate with a resolvable coordinate such as an endpoint midpoint
- **AND** approving that candidate persists the inferred coordinate rather than only logging it

#### Scenario: Photo is after previous-day track finish before today's first track

- **WHEN** a linked published photo has a stored capture timestamp on a later calendar day than a linked track's finish, and no later attached track has started yet (or the first track of the photo's capture day has not started)
- **THEN** an admin review flow may propose an after-finish candidate using that previous track's finish point
- **AND** the candidate and persisted provenance explicitly identify the placement as yesterday's / previous-day finish
- **AND** approving that candidate persists the inferred finish coordinate for later public use when review status is approved

#### Scenario: Time data is missing or ambiguous

- **WHEN** a linked photo or linked track lacks usable timestamp data, timed points needed for a resolvable coordinate, timezone context, or confidence needed for a proposal
- **THEN** the system SHALL avoid presenting an inferred coordinate as public fact
- **AND** the photo remains without a track-time map marker until a later approved coordinate exists

#### Scenario: Guest or non-admin does not see spike controls

- **WHEN** an anonymous visitor or non-admin signed-in user opens a hike surface
- **THEN** the system does not expose inferred-coordinate review controls
- **AND** it does not show unapproved inferred coordinates on the public hike map

### Requirement: Hike map roadmap is split into ordered implementation slices

The system SHALL track the hike detail map experience as multiple ordered implementation slices so combined tracks, direct photo GPS markers, inferred photo coordinates, day filtering, and future notes can be validated independently.

#### Scenario: Planning identifies the first public map slice

- **WHEN** the outdoor roadmap is reviewed after this planning change
- **THEN** the first map implementation slice is a published hike detail map that renders all linked published tracks with current successful map-ready geometry
- **AND** it does not include photo markers, inferred coordinates, day filtering, or notes

#### Scenario: Planning identifies the direct GPS marker slice

- **WHEN** the combined track map slice is complete or ready to extend
- **THEN** the next photo marker slice can add linked published photos with direct EXIF GPS coordinates
- **AND** it does not infer coordinates for photos without direct GPS data

#### Scenario: Planning identifies coordinate inference as a later slice

- **WHEN** linked published photos lack direct GPS coordinates but have capture timestamps and linked tracks provide usable time context
- **THEN** timestamp-based coordinate inference is implemented as the reviewed persistence slice with provenance, admin approval or manual correction, and public markers only after approval
- **AND** day filtering and notes remain later slices

#### Scenario: Planning defers hike notes

- **WHEN** the map roadmap mentions hike notes
- **THEN** notes remain out of the map implementation scope until a hike note domain exists
- **AND** the future note layer can be planned as an additional map overlay after the note model is accepted
