## ADDED Requirements

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
