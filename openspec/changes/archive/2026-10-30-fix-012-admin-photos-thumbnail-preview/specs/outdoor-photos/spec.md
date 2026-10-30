# Spec Delta

## ADDED Requirements

### Requirement: Admin photo list previews use compact app-owned thumbnails

The system SHALL render the first linked image of every row in the `/admin/photos` list through the application's compact thumbnail delivery path rather than a direct original provider URL. The system SHALL fall back to the list's existing non-image placeholder when the first linked image cannot be served as a thumbnail, and SHALL NOT change full-size image delivery, photo records, or public photo visibility.

#### Scenario: Admin opens the photos list

- **WHEN** an authenticated administrator opens `/admin/photos`
- **THEN** each row whose first linked image is an active outdoor-photo image renders a compact app-owned thumbnail
- **AND** the row does not load that image from its direct provider URL
- **AND** the row's title, image count, status, and updated timestamp are unchanged

#### Scenario: Row's first image cannot be served as a thumbnail

- **WHEN** a photo's first linked image is missing, not active, not an image, or not an outdoor-photo image
- **THEN** the row renders the list's existing non-image placeholder
- **AND** the row does not request that image from its provider

#### Scenario: Photo edit dialog still shows full-size images

- **WHEN** an authenticated administrator opens a photo's edit dialog
- **THEN** the dialog's image selection renders the original uploads as it does today
- **AND** the compact list preview does not replace full-size image delivery
