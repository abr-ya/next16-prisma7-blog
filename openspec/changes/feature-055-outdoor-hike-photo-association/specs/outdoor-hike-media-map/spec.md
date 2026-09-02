## MODIFIED Requirements

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

## ADDED Requirements

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
