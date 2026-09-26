# Spec Delta

## MODIFIED Requirements

### Requirement: Authorized trip users can contribute photos from trip detail

The system SHALL allow the signed-in creator of a published trip, an accepted active trip participant, or an authenticated administrator to open a photo contribution dialog from `/trips/[slug]`, upload one eligible image file by default, explicitly enable multi-image upload to submit up to three eligible image files as one photo, create a published photo owned by the submitting user, and attach it to that trip. The contribution dialog SHALL reuse the shared photo title, description, and image-upload controls used by the administrator photo workflow, without changing that administrator workflow or exposing its administrator-only controls or mutations in the public dialog. The system SHALL reject anonymous users, users without accepted active membership who are not the trip creator or an administrator, and submissions to a draft or unavailable trip.

#### Scenario: Accepted participant contributes a photo

- **WHEN** an accepted active participant opens the contribution dialog and uploads one eligible image file from a published trip detail page without enabling multi-image upload
- **THEN** the system creates a published photo owned by that participant
- **AND** attaches it to that trip so it is eligible for the existing trip photo gallery

#### Scenario: Contributor opts in to a grouped photo

- **WHEN** an eligible contributor explicitly enables multi-image upload and uploads two or three eligible image files from a published trip detail page
- **THEN** the system creates one published photo owned by that contributor with those images
- **AND** attaches it to that trip without changing the existing photo-record quota calculation

#### Scenario: Contribution dialog excludes administrator controls

- **WHEN** an eligible user opens the photo contribution dialog from a trip detail page
- **THEN** the dialog provides the shared title, description, image-upload controls, and an explicit multi-image opt-in
- **AND** it does not provide photo-status selection, EXIF refresh, edit, or other administrator-only controls

#### Scenario: Trip creator contributes a photo

- **WHEN** the signed-in creator uploads one eligible image file by default, or explicitly enables multi-image upload and uploads up to three eligible image files, from their published trip detail page
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
