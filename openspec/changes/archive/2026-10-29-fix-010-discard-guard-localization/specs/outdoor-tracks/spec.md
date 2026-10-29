# Spec Delta

## ADDED Requirements

### Requirement: The track discard guard renders its copy in the interface language

The system SHALL render the shared track discard guard's title, description, confirm label, and outcome toasts in the interface language of the surface that shows the guard, for the admin track create/edit modal and the trip-side `Add track` dialog. The guard's behavior SHALL NOT change as a result: a discard that removes an uploaded GPX file SHALL still confirm the removal, and a discard that removes no uploaded file SHALL still show no file confirmation. When the server rejects the discard of an uploaded GPX file, the system SHALL render the failure message in the interface language rather than in the server's own text.

#### Scenario: Admin track modal discard guard is rendered in the interface language

- **WHEN** an authenticated admin opens the discard confirmation for a dirty admin track create/edit modal
- **THEN** the system SHALL render the guard's title, description, and confirm label in the interface language
- **AND** the confirmation SHALL still state that an uploaded GPX file will be removed when one is present

#### Scenario: Trip-side Add track dialog discard guard is rendered in the interface language

- **WHEN** a trip creator opens the discard confirmation for a dirty trip-side `Add track` dialog
- **THEN** the system SHALL render the guard's title, description, and confirm label in the interface language
- **AND** the trip-side dialog SHALL NOT render any part of the guard's copy in a different language

#### Scenario: Discard outcome toasts are rendered in the interface language

- **WHEN** a confirmed discard removes an uploaded GPX file from the admin track modal or the trip-side `Add track` dialog
- **THEN** the system SHALL confirm the removal in the interface language
- **AND** a discard that removes no uploaded file SHALL still show no file confirmation

#### Scenario: Discard failure toast is rendered in the interface language

- **WHEN** the server rejects the discard of an uploaded GPX file
- **THEN** the system SHALL render the failure message in the interface language
- **AND** the dialog SHALL stay open with the uploaded file still selected
