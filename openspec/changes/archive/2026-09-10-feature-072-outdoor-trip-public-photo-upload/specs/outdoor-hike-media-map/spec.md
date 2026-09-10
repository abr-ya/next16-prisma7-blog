## ADDED Requirements

### Requirement: Authorized trip users can contribute photos from trip detail
The system SHALL allow the signed-in creator of a published trip, an accepted active trip participant, or an authenticated administrator to open a photo contribution dialog from `/trips/[slug]`, upload one to three eligible image files, create a published photo owned by the submitting user, and attach it to that trip. The contribution dialog SHALL reuse the shared photo title, description, and image-upload controls used by the administrator photo workflow, without exposing its administrator-only controls or mutations. The system SHALL reject anonymous users, users without accepted active membership who are not the trip creator or an administrator, and submissions to a draft or unavailable trip.

#### Scenario: Accepted participant contributes a photo
- **WHEN** an accepted active participant opens the contribution dialog and uploads one to three eligible image files from a published trip detail page
- **THEN** the system creates a published photo owned by that participant
- **AND** attaches it to that trip so it is eligible for the existing trip photo gallery

#### Scenario: Contribution dialog excludes administrator controls
- **WHEN** an eligible user opens the photo contribution dialog from a trip detail page
- **THEN** the dialog provides the shared title, description, and image-upload controls
- **AND** it does not provide photo-status selection, EXIF refresh, edit, or other administrator-only controls

#### Scenario: Trip creator contributes a photo
- **WHEN** the signed-in creator uploads one to three eligible image files from their published trip detail page
- **THEN** the system creates and attaches the published photo to that trip
- **AND** the photo is owned by the creator

#### Scenario: Unauthorized user attempts contribution
- **WHEN** an anonymous visitor, a pending/declined/cancelled participant, or a signed-in non-member attempts a trip photo submission
- **THEN** the system rejects the request
- **AND** it creates no photo or trip-photo association

#### Scenario: User attempts contribution to a draft trip
- **WHEN** an otherwise authorized user attempts a photo submission for a draft or unavailable trip
- **THEN** the system rejects the request
- **AND** it creates no photo or trip-photo association

### Requirement: Default contributor quota is enforced per trip
The system SHALL limit each non-administrator user to 10 photos created through the trip contribution workflow for one trip. The quota SHALL count photo records owned by that user and associated with that trip, rather than the number of image files within each photo. The trip creator is subject to the same default quota.

#### Scenario: User remains within their trip quota
- **WHEN** an authorized non-administrator user has fewer than 10 contributed photos for a trip and submits a valid photo
- **THEN** the system creates and attaches the photo
- **AND** the user's remaining contribution capacity decreases by one

#### Scenario: User reaches their trip quota
- **WHEN** an authorized non-administrator user already has 10 contributed photos for a trip and attempts another submission
- **THEN** the system rejects the submission with a clear limit-reached result
- **AND** it creates no additional photo or trip-photo association

#### Scenario: Concurrent submissions approach the quota
- **WHEN** concurrent submissions from one non-administrator user would cause more than 10 contributed photos to be attached to the same trip
- **THEN** the system persists no more than 10 of that user's contributed photos for the trip
- **AND** each rejected submission reports that the quota was reached

#### Scenario: Administrator contributes from trip detail
- **WHEN** an authenticated administrator submits a valid photo from a published trip detail page
- **THEN** the system permits the contribution without applying the default non-administrator quota
- **AND** the photo remains owned by the submitting administrator
