## Purpose

Defines the hike-centered outdoor media and map experience that connects published hikes with selected tracks, selected photos, hike participants, public contribution controls, direct photo coordinates, and later time-inferred photo coordinates.

## Requirements

### Requirement: Hikes are the primary public outdoor container

The system SHALL treat published hike detail pages as the first public surface for connected outdoor photos, tracks, and map context.

#### Scenario: Visitor opens hike with linked media

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has linked published tracks or linked published photos
- **THEN** the page displays those linked outdoor items within the hike detail experience
- **AND** it does not require the visitor to browse a standalone public photo gallery to understand the hike

#### Scenario: Visitor opens hike without linked media

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no linked published tracks or linked published photos
- **THEN** the page remains usable with the hike's own title, description, date range, and type
- **AND** it does not show broken media or map controls

### Requirement: Admin can associate tracks with hikes

The system SHALL allow authenticated admins to attach and detach track records to hike records without changing the track identity.

#### Scenario: Admin attaches a track to a hike

- **WHEN** an authenticated admin selects an existing track for an existing hike and saves the association
- **THEN** the track is associated with that hike
- **AND** the track remains manageable as its own track record

#### Scenario: Admin detaches a track from a hike

- **WHEN** an authenticated admin removes an existing hike-track association
- **THEN** the track is no longer displayed as part of that hike
- **AND** the track record and its linked GPX file asset are preserved

#### Scenario: Draft track is linked to published hike

- **WHEN** a published hike has an associated draft track
- **THEN** public hike pages SHALL NOT expose that draft track
- **AND** admin hike surfaces may still show the association to authenticated admins

### Requirement: Hike creator can manage participants

The system SHALL allow a hike creator to add and remove authenticated users as participants for that hike.

#### Scenario: Creator adds a participant

- **WHEN** the signed-in creator of a hike adds another existing user as a participant
- **THEN** that user becomes a participant for the hike
- **AND** the participant receives hike-scoped contribution permissions defined for participants

#### Scenario: Creator removes a participant

- **WHEN** the signed-in creator of a hike removes an existing participant from that hike
- **THEN** the removed user no longer has participant contribution permissions for that hike
- **AND** content already contributed by that user remains preserved unless removed through an explicit management action

#### Scenario: Non-creator manages participants

- **WHEN** a signed-in user who is neither the hike creator nor an admin attempts to add or remove hike participants
- **THEN** the system rejects the request
- **AND** the participant list remains unchanged

### Requirement: Admin can associate photos with hikes

The system SHALL allow authenticated admins to attach and detach photo records to hike records without changing the photo identity or image file assets.

#### Scenario: Admin attaches a photo to a hike

- **WHEN** an authenticated admin selects an existing photo for an existing hike and saves the association
- **THEN** the photo is associated with that hike
- **AND** the photo remains manageable as its own photo record

#### Scenario: Admin detaches a photo from a hike

- **WHEN** an authenticated admin removes an existing hike-photo association
- **THEN** the photo is no longer displayed as part of that hike
- **AND** the photo record and linked image file assets are preserved

#### Scenario: Draft photo is linked to published hike

- **WHEN** a published hike has an associated draft photo
- **THEN** public hike pages SHALL NOT expose that draft photo
- **AND** admin hike surfaces may still show the association to authenticated admins

### Requirement: Hike creator can upload tracks from the public hike page

The system SHALL allow the signed-in creator of a hike to upload a GPX track directly from that hike's public detail page and associate the resulting track with the hike.

#### Scenario: Creator uploads a track from hike detail

- **WHEN** the signed-in creator of a hike uploads a valid GPX file and required track metadata from `/hikes/[slug]`
- **THEN** the system creates or records the track through the outdoor track workflow
- **AND** it associates the track with that hike

#### Scenario: Participant attempts track upload

- **WHEN** a signed-in participant who is not the hike creator attempts to upload a track from `/hikes/[slug]`
- **THEN** the system rejects the track upload request
- **AND** no track or hike-track association is created

#### Scenario: Anonymous visitor attempts track upload

- **WHEN** an anonymous visitor attempts to upload a track from `/hikes/[slug]`
- **THEN** the system requires authentication
- **AND** no track or hike-track association is created

### Requirement: Hike creator and participants can upload photos from the public hike page

The system SHALL allow the signed-in creator and signed-in participants of a hike to upload photos directly from that hike's public detail page and associate the resulting photos with the hike.

#### Scenario: Creator uploads a photo from hike detail

- **WHEN** the signed-in creator of a hike uploads one or more valid image files and required photo metadata from `/hikes/[slug]`
- **THEN** the system creates or records the photo through the outdoor photo workflow
- **AND** it associates the photo with that hike

#### Scenario: Participant uploads a photo from hike detail

- **WHEN** a signed-in participant of a hike uploads one or more valid image files and required photo metadata from `/hikes/[slug]`
- **THEN** the system creates or records the photo through the outdoor photo workflow
- **AND** it associates the photo with that hike

#### Scenario: Non-participant attempts photo upload

- **WHEN** a signed-in user who is neither the hike creator, a hike participant, nor an admin attempts to upload a photo from `/hikes/[slug]`
- **THEN** the system rejects the photo upload request
- **AND** no photo or hike-photo association is created

#### Scenario: Anonymous visitor attempts photo upload

- **WHEN** an anonymous visitor attempts to upload a photo from `/hikes/[slug]`
- **THEN** the system requires authentication
- **AND** no photo or hike-photo association is created

### Requirement: Hike detail can render a combined track map

The system SHALL support a public hike map that renders all linked published tracks with current successful map-ready geometry.

#### Scenario: Visitor opens hike with mapped tracks

- **WHEN** a visitor opens a published hike with one or more linked published tracks that have current successful map-ready geometry
- **THEN** the hike detail page can render a combined map containing those track polylines
- **AND** the map viewport frames the combined bounds of the rendered tracks

#### Scenario: Linked track lacks map geometry

- **WHEN** a published hike has linked published tracks but none have current successful map-ready geometry
- **THEN** the hike detail page remains usable
- **AND** it does not parse or fetch raw GPX files during public rendering

### Requirement: Hike map can place photos with direct GPS coordinates

The system SHALL support displaying linked published photos on a hike map when those photos have visibility-safe stored GPS coordinates from extracted image metadata.

#### Scenario: Linked photo has direct GPS coordinates

- **WHEN** a published hike has a linked published photo with stored direct GPS latitude and longitude
- **THEN** the public hike map can show a marker for that photo
- **AND** the marker uses stored metadata rather than reparsing the image file

#### Scenario: Linked photo has no direct GPS coordinates

- **WHEN** a published hike has a linked published photo without stored direct GPS coordinates
- **THEN** the photo may still appear in the hike photo section
- **AND** it is not shown as a coordinate marker unless another accepted coordinate source exists

### Requirement: Photo coordinate inference from track time is planned separately

The system SHALL treat timestamp-based photo-to-track coordinate inference as a later explicit capability with reviewable assumptions, confidence, and fallback behavior.

#### Scenario: Photo capture time overlaps track time

- **WHEN** a linked published photo has a stored capture timestamp and a linked published track has stored trackpoint timestamps that can be compared safely
- **THEN** a later coordinate inference feature may derive a candidate photo coordinate from the track timeline
- **AND** it SHALL record that the coordinate source is inferred rather than direct EXIF GPS

#### Scenario: Time data is missing or ambiguous

- **WHEN** a linked photo or linked track lacks usable timestamp data, timezone context, or confidence needed for inference
- **THEN** the system SHALL avoid presenting an inferred coordinate as fact
- **AND** the photo remains visible in the hike photo section without a map marker from inference

### Requirement: Hike media visibility boundaries are explicit

The system SHALL expose only published hikes, published associated tracks, published associated photos, authorized contribution controls, and visibility-safe stored metadata on public hike pages.

#### Scenario: Published hike has private linked data

- **WHEN** a published hike has associated draft tracks, draft photos, private file assets, failed metadata extraction, or failed GPX parsing
- **THEN** public hike pages do not expose private records, provider URLs, unsafe errors, or raw source file URLs
- **AND** the page degrades gracefully around unavailable public media

#### Scenario: Visitor lacks contribution permission

- **WHEN** an anonymous visitor or signed-in non-participant opens a published hike page
- **THEN** the page may show public hike media and map content
- **AND** it does not expose upload controls or participant management controls to that visitor
