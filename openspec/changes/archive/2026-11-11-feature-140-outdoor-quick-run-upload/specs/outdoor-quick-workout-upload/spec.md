# Spec Delta

## MODIFIED Requirements

### Requirement: The owner starts a quick workout upload from a per-activity-type button

The system SHALL offer a quick workout upload on the owner's workouts page, SHALL bind each such button to one activity type, and SHALL open the same dialog for every one of them with that activity type applied.

#### Scenario: Owner opens the quick upload for an activity type

- **WHEN** a signed-in owner clicks the quick upload button for one activity type
- **THEN** the system opens the quick upload dialog
- **AND** the dialog is bound to that activity type
- **AND** the dialog offers no activity type control of its own

#### Scenario: Only activity types with a wording get a button

- **WHEN** the system renders the quick upload buttons
- **THEN** it renders a button only for those active activity types that have a wording entry in the interface language
- **AND** it renders no button for an activity type that has none

#### Scenario: The quick upload button is absent outside the owner's workouts page

- **WHEN** a signed-in owner opens the track workspace or the administrative track workspace
- **THEN** the system renders no quick upload button there

#### Scenario: Running has its own quick-add button

- **WHEN** the interface language has a wording entry for the running activity type and that activity type is active
- **THEN** the owner's workouts page renders a quick-add button for running next to the walking button
- **AND** clicking it opens the same quick upload dialog bound to running
- **AND** the suggested title, the slug base, and the preselected gear use the running activity type

#### Scenario: Running is visually distinct from walking

- **WHEN** the owner's workouts page renders both the walking and the running quick-add buttons
- **THEN** the walking button is a primary button with a footprints icon
- **AND** the running button is an outline button with a lightning icon
- **AND** neither button relies on its label alone to be told apart

#### Scenario: The walking quick-add button comes first

- **WHEN** the owner's workouts page renders more than one quick-add button
- **THEN** the walking button comes first
- **AND** the other quick-add buttons follow it in alphabetical order by activity type name
