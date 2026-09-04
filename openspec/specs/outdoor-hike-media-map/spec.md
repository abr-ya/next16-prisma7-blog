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

The system SHALL allow authenticated admins to attach and detach track records to hike records without changing the track identity, hike identity, linked GPX file asset, or stored parsed track metadata.

#### Scenario: Admin attaches a track to a hike

- **WHEN** an authenticated admin selects an existing track for an existing hike and saves the association
- **THEN** the track is associated with that hike
- **AND** the track remains manageable as its own track record
- **AND** the hike remains manageable as its own hike record

#### Scenario: Admin detaches a track from a hike

- **WHEN** an authenticated admin removes an existing hike-track association
- **THEN** the track is no longer displayed as part of that hike
- **AND** the track record and its linked GPX file asset are preserved
- **AND** the hike record is preserved

#### Scenario: Admin views associated tracks from a hike

- **WHEN** an authenticated admin opens a hike management surface for a hike with associated tracks
- **THEN** the admin can see which tracks are associated with that hike
- **AND** the admin can distinguish draft and published associated tracks

#### Scenario: Admin views associated hikes from a track

- **WHEN** an authenticated admin opens a track management surface for a track associated with one or more hikes
- **THEN** the admin can see which hikes are associated with that track
- **AND** the admin can distinguish draft and published associated hikes

#### Scenario: Admin attaches the same track twice

- **WHEN** an authenticated admin attempts to attach a track to a hike that already has that track association
- **THEN** the system keeps only one association for that hike and track pair
- **AND** it does not duplicate public or admin linked-track output

#### Scenario: Non-admin attempts to manage track associations

- **WHEN** a signed-in non-admin or anonymous visitor attempts to attach or detach tracks from a hike
- **THEN** the system rejects the request
- **AND** the hike-track associations remain unchanged

#### Scenario: Draft track is linked to published hike

- **WHEN** a published hike has an associated draft track
- **THEN** public hike pages SHALL NOT expose that draft track
- **AND** admin hike surfaces may still show the association to authenticated admins

#### Scenario: Published track is linked to draft hike

- **WHEN** a published track is associated with a draft hike
- **THEN** public track pages SHALL NOT expose that draft hike
- **AND** admin track surfaces may still show the association to authenticated admins

### Requirement: Public hike pages show linked published tracks

The system SHALL show associated published tracks on published hike detail pages while preserving existing track visibility and file download boundaries.

#### Scenario: Visitor opens hike with linked published tracks

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has associated published tracks
- **THEN** the page shows those linked tracks within the hike detail experience
- **AND** each linked track provides enough visibility-safe information to open the public track detail page

#### Scenario: Visitor opens hike with no public linked tracks

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no associated published tracks
- **THEN** the page remains usable with the hike's own title, description, date range, and type
- **AND** it does not show broken linked-track controls

#### Scenario: Linked track file is not public-download eligible

- **WHEN** a published hike has an associated published track whose GPX file is private or inactive
- **THEN** the public hike page may still link to the public track detail page when the track itself is published
- **AND** it does not expose a direct GPX provider URL or bypass the existing track download rules

### Requirement: Public track pages show linked published hikes

The system SHALL show associated published hikes on published track detail pages without exposing draft hikes or private hike metadata.

#### Scenario: Visitor opens track with linked published hikes

- **WHEN** a visitor opens `/tracks/[slug]` for a published track that is associated with one or more published hikes
- **THEN** the page shows links to those published hikes
- **AND** each linked hike provides enough visibility-safe information to open the public hike detail page

#### Scenario: Visitor opens track with no public linked hikes

- **WHEN** a visitor opens `/tracks/[slug]` for a published track that has no associated published hikes
- **THEN** the page remains usable with the existing track detail content
- **AND** it does not show broken linked-hike controls

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

The system SHALL allow authenticated admins to attach, detach, and order photo records for hike records without changing the photo identity, hike identity, image file assets, or stored extracted photo metadata.

#### Scenario: Admin attaches a photo to a hike

- **WHEN** an authenticated admin selects an existing photo for an existing hike and saves the association
- **THEN** the photo is associated with that hike
- **AND** the photo remains manageable as its own photo record
- **AND** the hike remains manageable as its own hike record

#### Scenario: Admin detaches a photo from a hike

- **WHEN** an authenticated admin removes an existing hike-photo association
- **THEN** the photo is no longer displayed as part of that hike
- **AND** the photo record and linked image file assets are preserved
- **AND** the hike record is preserved

#### Scenario: Admin views associated photos from a hike

- **WHEN** an authenticated admin opens a hike management surface for a hike with associated photos
- **THEN** the admin can see which photos are associated with that hike
- **AND** the admin can distinguish draft and published associated photos

#### Scenario: Admin views associated hikes from a photo

- **WHEN** an authenticated admin opens a photo management surface for a photo associated with one or more hikes
- **THEN** the admin can see which hikes are associated with that photo
- **AND** the admin can distinguish draft and published associated hikes

#### Scenario: Admin attaches the same photo twice

- **WHEN** an authenticated admin attempts to attach a photo to a hike that already has that photo association
- **THEN** the system keeps only one association for that hike and photo pair
- **AND** it does not duplicate public or admin linked-photo output

#### Scenario: Admin orders photos within a hike

- **WHEN** an authenticated admin changes the order of photos associated with a hike
- **THEN** the system stores the order for that hike-photo association set
- **AND** the same photo may keep a different order when associated with another hike

#### Scenario: Non-admin attempts to manage photo associations

- **WHEN** a signed-in non-admin or anonymous visitor attempts to attach, detach, or reorder photos for a hike
- **THEN** the system rejects the request
- **AND** the hike-photo associations remain unchanged

#### Scenario: Draft photo is linked to published hike

- **WHEN** a published hike has an associated draft photo
- **THEN** public hike pages SHALL NOT expose that draft photo
- **AND** admin hike surfaces may still show the association to authenticated admins

#### Scenario: Published photo is linked to draft hike

- **WHEN** a published photo is associated with a draft hike
- **THEN** public navigation SHALL NOT expose that association as a public photo gallery or public hike detail page
- **AND** admin photo surfaces may still show the association to authenticated admins

### Requirement: Public hike pages show linked published photos

The system SHALL show associated published photos on published hike detail pages while preserving existing photo visibility, image file, and metadata boundaries.

#### Scenario: Visitor opens hike with linked published photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has associated published photos
- **THEN** the page shows those linked photos within the hike detail experience
- **AND** the photos render in the hike-specific stored order
- **AND** each linked photo uses visibility-safe image data suitable for public display

#### Scenario: Visitor opens hike with no public linked photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no associated published photos
- **THEN** the page remains usable with the hike's own title, description, date range, type, and any other public media
- **AND** it does not show broken linked-photo controls

#### Scenario: Linked photo image is not public-display eligible

- **WHEN** a published hike has an associated published photo whose image file asset is private, inactive, missing, or otherwise not public-display eligible
- **THEN** the public hike page does not expose that image file or provider URL
- **AND** the page degrades gracefully around the unavailable linked photo image

#### Scenario: Linked photo has extracted metadata

- **WHEN** a published hike has an associated published photo with stored EXIF, GPS, camera, or extraction error metadata
- **THEN** the public hike page SHALL NOT expose new public photo EXIF, GPS, camera, or extraction error details from this slice
- **AND** it may still display the photo image and basic visibility-safe title or description fields

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

- **WHEN** linked published photos lack direct GPS coordinates but have capture timestamps
- **THEN** timestamp-based coordinate inference remains a later slice with explicit confidence, provenance, admin review, and manual correction behavior

#### Scenario: Planning defers hike notes

- **WHEN** the map roadmap mentions hike notes
- **THEN** notes remain out of the map implementation scope until a hike note domain exists
- **AND** the future note layer can be planned as an additional map overlay after the note model is accepted

### Requirement: Hike map layer order is explicit

The system SHALL define the hike detail map as a layered public surface where linked track geometry provides route context and point-like content layers can be added only from accepted coordinate sources.

#### Scenario: Map renders tracks and photo markers together

- **WHEN** a visitor opens a published hike with mapped tracks and linked published photos that have accepted public coordinates
- **THEN** the public hike map can render track polylines and photo markers in the same map viewport
- **AND** the map bounds account for all visible track geometry and visible markers

#### Scenario: Map has no coordinate-backed layers

- **WHEN** a published hike has no linked published tracks with map-ready geometry and no linked published photos with accepted public coordinates
- **THEN** the hike detail page remains usable without showing broken map controls

### Requirement: Hike photo map markers have visibility-safe tooltips

The system SHALL allow public hike map photo markers to expose only visibility-safe photo information in hover or focus tooltips.

#### Scenario: Visitor hovers over a photo marker

- **WHEN** a visitor hovers or focuses a map marker for a linked published photo
- **THEN** the tooltip may show the photo title, a visibility-safe thumbnail or preview, and basic hike-linked photo context
- **AND** it does not expose original provider URLs, full-size image bytes, hidden EXIF metadata, extraction errors, or private file details

#### Scenario: Marker photo lacks a safe preview

- **WHEN** a linked published photo has an accepted public coordinate but no eligible visibility-safe thumbnail or preview
- **THEN** the marker may still show a text-only tooltip
- **AND** it does not fetch or reveal an ineligible image asset

### Requirement: Hike map can filter by all days or a single day

The system SHALL plan for a public hike map view mode that can show all accepted map layers together or only the map layers belonging to one selected hike day.

#### Scenario: Visitor views all hike days

- **WHEN** a visitor opens the default map view for a multi-day published hike
- **THEN** the map can show all visible linked track geometry and all visible photo markers with accepted public coordinates

#### Scenario: Visitor selects one hike day

- **WHEN** a visitor selects a single day from the hike date range
- **THEN** the map can limit visible track geometry and photo markers to content whose accepted date falls on that day
- **AND** content without an accepted date for that day is not forced into the filtered view

#### Scenario: Day assignment is ambiguous

- **WHEN** a linked track or photo has missing, conflicting, or timezone-ambiguous date data
- **THEN** the system SHALL avoid presenting the item as confidently belonging to a specific day
- **AND** the item may remain visible in the all-days view when it is otherwise public and map-eligible

### Requirement: Hike map planning preserves public visibility boundaries

The system SHALL preserve existing public visibility boundaries when map layers are added to published hike detail pages.

#### Scenario: Published hike has private or draft map-related content

- **WHEN** a published hike has draft tracks, draft photos, private file assets, failed metadata extraction, unapproved inferred coordinates, or future private notes
- **THEN** the public hike map does not expose those private records, unsafe details, or source file URLs
- **AND** the hike detail page degrades gracefully around unavailable map layers
