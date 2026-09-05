## Purpose

Defines outdoor photo capability: storing first-party image-backed photos, admin management with EXIF/GPS metadata extraction, and keeping public gallery, hike association, album, and map-marker behavior for later slices.

## Requirements

### Requirement: Photo records store core image-backed information

The system SHALL store outdoor photos with title, optional description, publication status, one to three associated image file assets, owner, creation timestamp, and update timestamp.

#### Scenario: Photo has required fields

- **WHEN** an authenticated admin creates a photo with valid title, status, and one to three eligible image file assets
- **THEN** the system stores the photo with those values
- **AND** it records the creating user and timestamps

#### Scenario: Photo requires at least one image

- **WHEN** an authenticated admin submits a photo without an image file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not create or update the photo

#### Scenario: Photo rejects too many images

- **WHEN** an authenticated admin submits a photo with more than three image file assets
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the extra image files to the photo

#### Scenario: Photo rejects ineligible file asset

- **WHEN** an authenticated admin submits a photo that references a missing, non-active, non-photo-purpose, or already-bound image file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the ineligible file to the photo

### Requirement: Admin can manage photos

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting photo records.

#### Scenario: Admin opens photos page

- **WHEN** an authenticated admin opens `/admin/photos`
- **THEN** the page displays stored photos with title, image count, status, and updated timestamp

#### Scenario: Admin creates photo with image upload

- **WHEN** an authenticated admin uploads one to three valid image files and submits valid new photo fields from the admin UI
- **THEN** the photo appears in the admin photos list
- **AND** the photo references the uploaded image file assets

#### Scenario: Admin edits photo metadata

- **WHEN** an authenticated admin updates editable metadata fields for an existing photo
- **THEN** the system persists the changes
- **AND** it preserves the photo identity and associated image file assets unless the admin changes the image selection

#### Scenario: Admin replaces photo images

- **WHEN** an authenticated admin saves an existing photo with a different eligible image file asset selection
- **THEN** the photo references the new ordered image selection
- **AND** previously referenced file assets are not deleted automatically by this slice

#### Scenario: Admin deletes photo

- **WHEN** an authenticated admin deletes a photo
- **THEN** the photo is removed from the admin photos list
- **AND** linked image file assets remain stored unless removed through existing or future file-management workflows

### Requirement: Photos are discoverable in admin navigation

The system SHALL expose the photo admin page through the admin navigation for authenticated admins.

#### Scenario: Admin sees photos navigation item

- **WHEN** an authenticated admin opens the admin area
- **THEN** the admin navigation includes a Photos link that points to `/admin/photos`

### Requirement: Photo publication status is stored without standalone public gallery exposure

The system SHALL store whether a photo is draft or published while exposing published photos publicly only through accepted hike-linked surfaces until a standalone public photo gallery is explicitly added. Hike-linked guest image exposure SHALL be limited to true technical thumbnails, and full-size photo image access SHALL require an authenticated site user.

#### Scenario: Admin marks photo as published

- **WHEN** an authenticated admin saves a photo with `PUBLISHED` status
- **THEN** the system stores the status for future public exposure
- **AND** the photo becomes eligible for hike-linked public rendering only when associated with a published hike

#### Scenario: Published photo is associated with a published hike

- **WHEN** a published photo is associated with a published hike
- **THEN** the photo becomes eligible to appear on that hike's public detail page
- **AND** anonymous visitors may receive only thumbnail-sized image responses for that photo
- **AND** authenticated site users may access the large-photo viewing experience for that photo
- **AND** it does not create a standalone public photo detail route or global public photo listing

#### Scenario: Visitor cannot browse photos through standalone photo routes

- **WHEN** a visitor uses existing public navigation or known outdoor routes
- **THEN** the system does not expose a standalone public `/photos` or `/photos/[slug]` experience from this slice
- **AND** public photo exposure remains hike-linked rather than a global photo gallery

### Requirement: Photos store extracted EXIF metadata

The system SHALL store versioned extraction metadata for outdoor photos so admin and future public workflows can read capture details without reparsing image files during normal page rendering.

#### Scenario: Admin extracts metadata from a photo with EXIF

- **WHEN** an authenticated admin extracts metadata for a photo whose current image files contain readable EXIF data
- **THEN** the system stores extraction status, parser version, extracted timestamp, source image file identity, capture date when available, image dimensions when available, orientation when available, and camera or lens details when available
- **AND** normal admin photo rendering reads those stored values instead of reparsing the image files

#### Scenario: Photo image has no EXIF

- **WHEN** an authenticated admin extracts metadata for a photo whose current image files contain no readable EXIF data
- **THEN** the system stores a completed extraction state with empty unavailable EXIF fields
- **AND** it keeps the photo editable and visible in admin workflows

#### Scenario: Metadata extraction fails safely

- **WHEN** metadata extraction fails because an image cannot be fetched, decoded, or parsed
- **THEN** the system stores a failed extraction state with a safe error message
- **AND** it does not expose private provider URLs in the error message
- **AND** it does not delete or otherwise corrupt the photo record or image file assets

### Requirement: Photos store best-effort GPS coordinates from image metadata

The system SHALL attempt to extract GPS coordinates from outdoor photo image metadata and store normalized latitude and longitude when valid coordinates are available.

#### Scenario: Photo image has GPS coordinates

- **WHEN** an authenticated admin extracts metadata for a photo whose current image files contain valid GPS latitude and longitude data
- **THEN** the system stores normalized decimal latitude and longitude values associated with the extracted photo metadata
- **AND** it records which image file supplied the coordinates

#### Scenario: Photo image has no GPS coordinates

- **WHEN** an authenticated admin extracts metadata for a photo whose current image files have no valid GPS latitude and longitude data
- **THEN** the system completes extraction without GPS coordinates
- **AND** it does not treat missing GPS data as an error

#### Scenario: Multiple photo images contain GPS coordinates

- **WHEN** an authenticated admin extracts metadata for a photo with multiple image files that contain valid GPS coordinates
- **THEN** the system stores a primary normalized coordinate from the first eligible image in photo image order
- **AND** it keeps per-image source details sufficient to understand which image supplied the primary coordinate

### Requirement: Admin can view and refresh photo metadata extraction

The system SHALL expose photo metadata extraction state and refresh controls to authenticated admins without adding public photo metadata pages.

#### Scenario: Admin sees extracted photo metadata

- **WHEN** an authenticated admin opens `/admin/photos`
- **THEN** the page shows each photo's metadata extraction state
- **AND** it displays useful extracted summary values such as capture date, dimensions, camera label, and GPS presence when available

#### Scenario: Admin refreshes photo metadata

- **WHEN** an authenticated admin refreshes metadata for an existing photo
- **THEN** the system attempts extraction from the photo's current ordered image files
- **AND** it replaces the previous extraction metadata with the latest success or failure result

#### Scenario: Photo image selection changes

- **WHEN** an authenticated admin replaces the image selection for an existing photo
- **THEN** the system SHALL prevent metadata extracted from the previous image selection from being treated as current
- **AND** admin UI SHALL make the photo's metadata state indicate that refresh is needed or pending

#### Scenario: Visitor cannot access photo EXIF or GPS data

- **WHEN** a visitor uses existing public navigation or known outdoor routes
- **THEN** the system SHALL NOT expose new public photo EXIF or GPS metadata from this slice

### Requirement: Photo map coordinates record source and public readiness

The system SHALL distinguish photo coordinates by source so direct EXIF GPS, inferred track-time coordinates, and manually corrected coordinates can be handled differently before public map display. For this slice, stored direct EXIF GPS from a successful extraction is an accepted public hike map-marker source when the photo is published and linked to a published hike.

#### Scenario: Photo has direct EXIF GPS coordinates

- **WHEN** a photo metadata extraction stores valid GPS latitude and longitude from image metadata
- **THEN** the photo has a direct coordinate source suitable for a public hike map marker when the photo and hike association are otherwise public
- **AND** the source remains distinguishable from inferred or manually corrected coordinates

#### Scenario: Public hike map uses only direct GPS in this slice

- **WHEN** a published hike map renders photo markers
- **THEN** only linked published photos with valid stored direct EXIF GPS are included
- **AND** inferred or manually corrected coordinates are not required or invented by this slice

#### Scenario: Photo has inferred coordinates

- **WHEN** a future inference process derives candidate coordinates from the photo capture time and linked track timelines
- **THEN** the candidate coordinates are recorded as inferred rather than direct EXIF GPS
- **AND** they are not treated as public-ready until accepted by the approved review behavior

#### Scenario: Photo coordinate is manually corrected

- **WHEN** an authorized admin manually corrects or confirms a photo coordinate
- **THEN** the corrected coordinate can be recorded as manually corrected or admin-approved
- **AND** future public map behavior can prefer the accepted corrected coordinate over an unapproved inferred candidate

### Requirement: Inferred photo coordinates require confidence and review

The system SHALL require timestamp-inferred photo coordinates to carry enough provenance and confidence information for admin review before public hike map display. An admin-only matching spike may present non-persistent candidates and log an accepted suggestion before that persistence/review model exists.

#### Scenario: Spike proposes a track-time candidate

- **WHEN** an authenticated admin opens the track-time matching spike for a hike-linked photo that lacks direct EXIF GPS but has a usable capture timestamp
- **THEN** the system may show zero or more candidate explanations based on linked track recording windows and simple between-track gaps
- **AND** it does not write inferred coordinates to the photo record in this spike

#### Scenario: Admin accepts a spike candidate

- **WHEN** an authenticated admin accepts one spike candidate
- **THEN** the system logs the accepted candidate details for evaluation
- **AND** the public hike map does not gain an inferred marker from that acceptance

#### Scenario: Inference creates a candidate coordinate

- **WHEN** a future inference process matches a photo capture timestamp to a linked track timeline
- **THEN** the candidate stores the coordinate, source track identity, matched timestamp context, confidence or match quality, and inference status
- **AND** the public hike map does not display the candidate until it is approved or manually corrected according to the accepted workflow

#### Scenario: Inference cannot produce a confident candidate

- **WHEN** a photo lacks usable capture time, all linked tracks lack usable timestamps, or the match is outside accepted confidence bounds
- **THEN** the system records no public-ready inferred coordinate for that photo
- **AND** the photo may remain visible in the hike photo gallery or section without a map marker

#### Scenario: Inferred coordinate is rejected

- **WHEN** an authorized admin rejects an inferred photo coordinate
- **THEN** the rejected coordinate is not displayed on public hike maps
- **AND** the rejection does not delete the photo, its image assets, or its direct EXIF metadata if present

### Requirement: Photo day assignment is based on accepted temporal metadata

The system SHALL plan photo day filtering around accepted temporal metadata rather than file upload time or arbitrary association order.

#### Scenario: Photo has accepted capture date

- **WHEN** a linked published photo has a stored capture timestamp whose date can be interpreted for the hike day model
- **THEN** a future day-filtered hike map can include that photo marker on the matching day when the photo also has an accepted public coordinate

#### Scenario: Photo date is unavailable or ambiguous

- **WHEN** a linked published photo lacks a capture timestamp or has unresolved timezone ambiguity
- **THEN** the photo is not shown as confidently belonging to a single day in future day-filtered map views
- **AND** the photo may still appear in all-days views when it otherwise has an accepted public coordinate
