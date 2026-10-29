# Spec Delta

## ADDED Requirements

### Requirement: The quick upload discard guard renders its copy in the interface language

The system SHALL render the shared track discard guard's title, description, confirm label, and outcome toasts in the interface language of the quick upload dialog. The quick upload's discard behavior SHALL NOT change as a result: the owner SHALL still be asked to confirm before the uploaded file is marked for deletion, and a discard that removes no uploaded file SHALL still show no file confirmation.

#### Scenario: Quick upload discard confirmation is rendered in the interface language

- **WHEN** a signed-in owner closes the quick upload dialog that holds an uploaded but unsaved file
- **THEN** the system SHALL render the discard confirmation's title, description, and confirm label in the interface language
- **AND** the confirmation SHALL still tell the owner that the uploaded file will be marked for deletion

#### Scenario: Quick upload discard outcome toast is rendered in the interface language

- **WHEN** a confirmed discard marks the quick upload's uploaded file for deletion
- **THEN** the system SHALL confirm the removal in the interface language
- **AND** a discard that removes no uploaded file SHALL still show no file confirmation

#### Scenario: Quick upload discard failure toast is rendered in the interface language

- **WHEN** the server rejects the discard of the quick upload's uploaded file
- **THEN** the system SHALL render the failure message in the interface language
- **AND** the dialog SHALL stay open with the uploaded file still selected
