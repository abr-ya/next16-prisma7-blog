# Spec Delta

## ADDED Requirements

### Requirement: Admin trip-photo association previews use compact app-owned thumbnails
The system SHALL show each available or attached photo's first image in the authenticated administrator **Manage photos** workflow through the application's compact thumbnail delivery path rather than a direct original provider URL. The preview change SHALL preserve the existing attach, detach, ordering, and coordinate-review controls and SHALL NOT change public trip-photo visibility or full-photo access.

#### Scenario: Administrator opens photos management with draft or unlinked photos
- **WHEN** an authenticated administrator opens **Manage photos** for a trip that has available draft, unlinked, or published photos
- **THEN** each row with a first image renders a compact app-owned thumbnail
- **AND** the administrator can continue to identify, attach, detach, and order those photos under the existing authorization rules
- **AND** the row does not load that image from its direct provider URL

#### Scenario: Photo has no first image
- **WHEN** a photo shown in **Manage photos** has no first image available for preview
- **THEN** the workflow renders its existing non-image fallback
- **AND** it preserves the row's remaining management controls

#### Scenario: Public trip gallery remains unchanged
- **WHEN** a visitor opens a published trip's public photo gallery
- **THEN** guest thumbnail and authenticated full-photo access retain their existing visibility boundaries
- **AND** administrator preview support does not expose a new public path to draft, unlinked, or full-size photo images
