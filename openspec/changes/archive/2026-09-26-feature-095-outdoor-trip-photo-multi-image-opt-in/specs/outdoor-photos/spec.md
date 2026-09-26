# Spec Delta

## MODIFIED Requirements

### Requirement: Trip contribution creates standard image-backed photos

The system SHALL create photos submitted through an authorized trip detail workflow using the same one-to-three eligible image file asset constraints, ownership, publication status, and metadata-extraction compatibility as other outdoor photo records. The public trip contribution dialog SHALL begin in a single-image mode and SHALL make two- or three-image submissions available only after the contributor explicitly enables multi-image upload. Each successful submission SHALL create one published photo record and one ordered association to the submitted trip.

#### Scenario: Contributor uses the default single-image mode

- **WHEN** an authorized user opens the public trip photo contribution dialog
- **THEN** the dialog permits one image for the new photo by default
- **AND** it does not present a second or third image as available until the user explicitly enables multi-image upload

#### Scenario: Contribution preserves the existing multi-image photo model

- **WHEN** an authorized user enables the dialog's multi-image option and submits two or three eligible image files as one trip photo contribution
- **THEN** the dialog permits up to three eligible image files for the one contributed photo
- **AND** the system stores their image assets in submission order and counts the result as one contributed photo toward that user's trip quota

#### Scenario: Contribution includes an ineligible image asset

- **WHEN** a trip photo submission references a missing, inactive, wrong-purpose, already-bound, or another user's image file asset
- **THEN** the system rejects the submission
- **AND** it creates no photo record or trip-photo association

#### Scenario: Contribution cannot complete atomically

- **WHEN** creating the photo record, binding its image assets, or attaching it to the trip cannot all complete successfully
- **THEN** the system does not leave a new partially created photo or trip-photo association
- **AND** existing file assets remain governed by the file-management lifecycle
