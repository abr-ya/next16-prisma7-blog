# Spec Delta

## ADDED Requirements

### Requirement: A discarded uploaded GPX is confirmed to the trip creator

The system SHALL confirm the removal of an uploaded GPX file to the trip creator when the trip-side `Add track` dialog is discarded and the discard removes that file. The confirmation SHALL use the same wording in the trip-side `Add track` dialog and in the admin track create/edit dialog. The confirmation SHALL NOT appear when a discard removes no uploaded file.

#### Scenario: Trip-side discard of an uploaded GPX is confirmed

- **WHEN** a trip creator uploads a GPX file in the trip-side `Add track` dialog and confirms the discard confirmation
- **THEN** the system SHALL mark the uploaded file for deletion
- **AND** it SHALL confirm to the trip creator that the uploaded GPX file was discarded

#### Scenario: Discard without an uploaded GPX shows no file confirmation

- **WHEN** a trip creator discards the trip-side `Add track` dialog without an uploaded GPX file
- **THEN** the system SHALL close the dialog
- **AND** it SHALL NOT show an uploaded-file discard confirmation

#### Scenario: Both track dialogs use the same confirmation

- **WHEN** an authenticated admin discards the admin track create/edit dialog with an uploaded GPX file
- **THEN** the system SHALL confirm the discard with the same wording the trip-side dialog uses
- **AND** a discard that removes no uploaded file SHALL show no confirmation in either dialog
