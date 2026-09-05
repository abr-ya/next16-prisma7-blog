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
