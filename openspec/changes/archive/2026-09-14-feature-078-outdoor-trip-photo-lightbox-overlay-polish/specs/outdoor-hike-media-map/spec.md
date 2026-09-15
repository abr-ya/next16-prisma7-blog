## MODIFIED Requirements

### Requirement: Public hike pages show linked published photos

The system SHALL show associated published photos on published hike detail pages while preserving separate guest thumbnail access, authenticated full-photo access, existing photo visibility, image file, and metadata boundaries.

#### Scenario: Visitor opens hike with linked published photos

- **WHEN** an anonymous visitor opens `/hikes/[slug]` for a published hike that has associated published photos
- **THEN** the page shows the linked photo set within the hike detail experience using true thumbnail-sized image responses only
- **AND** the photos render in the hike-specific stored order
- **AND** the page SHALL NOT expose full-size photo image bytes, provider URLs, or large-photo viewer controls to the anonymous visitor

#### Scenario: Signed-in user opens hike with linked published photos

- **WHEN** an authenticated site user opens `/hikes/[slug]` for a published hike that has associated published photos
- **THEN** the page shows the linked photo set within the hike detail experience
- **AND** the user can open a large-photo viewer for those photos
- **AND** the viewer renders linked photos in the hike-specific stored order
- **AND** the viewer identifies the active photo's ordinal and the total number of linked photos

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
- **AND** it may still display basic visibility-safe title or description fields

#### Scenario: Guest attempts to access full photo directly

- **WHEN** an anonymous visitor requests a full-size linked hike photo image directly
- **THEN** the system rejects the request with an authentication-required response
- **AND** it does not return the full-size image bytes

### Requirement: Authorized trip photo viewer exposes photo details

The system SHALL let an authenticated viewer who is the linked photo owner, the published trip creator, an accepted active trip participant, or an administrator open a details view from that trip's photo card or large-photo viewer. The details view SHALL show the extracted capture summary that is available for the photo, the accepted coordinate when present, and the coordinate source and confidence/provenance. In the large-photo viewer, the details view SHALL render as a compact semi-transparent overlay over the displayed image, and opening or closing it SHALL NOT change the dialog geometry or require dialog scrolling. Anonymous visitors and signed-in users without that trip relationship SHALL retain the existing image-only gallery and SHALL NOT receive the new metadata or exact-coordinate projection.

#### Scenario: Authorized participant opens photo details

- **WHEN** an accepted active participant opens a published trip photo's details view from the large-photo viewer
- **THEN** the system displays available capture date, camera, dimensions, exposure, GPS presence, and accepted coordinate provenance in an overlay over that photo
- **AND** unavailable metadata or coordinates are represented without an extraction error detail or invented location
- **AND** the viewer remains at the same dialog size without requiring scroll caused by the details view

#### Scenario: Unrelated viewer opens a photo

- **WHEN** an anonymous visitor or signed-in user who is not the photo owner, trip creator, accepted active participant, or administrator opens a published trip photo
- **THEN** the system preserves the existing image-only gallery/viewer behavior
- **AND** it does not expose the new EXIF fields, exact coordinate, coordinate provenance, or review controls
