# Spec Delta

## ADDED Requirements

### Requirement: Administrators can retrieve compact outdoor-photo thumbnails for administration
The app-owned thumbnail delivery path SHALL allow an authenticated administrator to retrieve a compact thumbnail for any active image file asset used as an outdoor-photo image in an authorized administrator workflow. This administrator path SHALL not make that asset available to guests and SHALL not provide a direct original provider URL.

#### Scenario: Administrator requests a draft outdoor-photo thumbnail
- **WHEN** an authenticated administrator requests the thumbnail for an active outdoor-photo image that is draft or not linked to a published trip
- **THEN** the application returns a compact image response through its thumbnail route
- **AND** it does not disclose the storage provider URL

#### Scenario: Guest requests a non-public outdoor-photo thumbnail
- **WHEN** an anonymous visitor requests the thumbnail for an active outdoor-photo image that is draft or not linked to a published trip
- **THEN** the application denies the request
- **AND** it does not return image bytes or the storage provider URL

#### Scenario: Administrator requests an ineligible file thumbnail
- **WHEN** an authenticated administrator requests the thumbnail for a missing, inactive, non-image, or non-outdoor-photo file asset
- **THEN** the application denies the request using the existing unavailable-file behavior
- **AND** it does not disclose the storage provider URL
