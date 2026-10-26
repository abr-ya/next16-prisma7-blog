# Spec Delta

## ADDED Requirements

### Requirement: An owner can assign one owned gear record to a track

The system SHALL let a signed-in owner attach at most one of their own gear records to a track they own, SHALL let the owner clear that attachment, and SHALL refuse an attachment whose gear does not belong to that owner or whose gear activity types contradict the track's activity type.

#### Scenario: Owner attaches their own gear to a track

- **WHEN** a signed-in owner selects one of their own gear records in the track form and saves
- **THEN** the system stores the attachment on that track
- **AND** the track keeps exactly one gear record attached

#### Scenario: Owner clears the attachment

- **WHEN** a signed-in owner saves the track form with no gear selected
- **THEN** the system removes the gear attachment from that track
- **AND** it leaves the track itself unchanged

#### Scenario: A track is saved without a gear selection

- **WHEN** a signed-in owner saves a track that carries no gear
- **THEN** the system stores the track with no gear attached
- **AND** it does not create a placeholder gear record

#### Scenario: Owner submits gear belonging to another owner

- **WHEN** a signed-in owner submits a gear record that belongs to a different owner for attachment
- **THEN** the system refuses the save
- **AND** it leaves the track's existing attachment unchanged

#### Scenario: Owner submits gear that does not fit the track's activity type

- **WHEN** a signed-in owner submits a gear record whose activity types do not include the track's activity type
- **THEN** the system refuses the save
- **AND** it leaves the track's existing attachment unchanged

#### Scenario: Owner attaches unclassified gear

- **WHEN** a signed-in owner submits a gear record that carries no activity type for attachment
- **THEN** the system stores the attachment on that track
- **AND** it accepts the pair regardless of the track's activity type

#### Scenario: Owner attaches gear to a track that has no activity type

- **WHEN** a signed-in owner submits one of their own gear records for a track that carries no activity type
- **THEN** the system stores the attachment on that track

#### Scenario: Owner changes the track's activity type to one the attached gear does not fit

- **WHEN** a signed-in owner changes the activity type of a track that already carries a gear record, to a type the gear does not support
- **THEN** the system refuses the save
- **AND** it keeps the track's activity type and its gear attachment unchanged

#### Scenario: The administrative track surface carries no gear

- **WHEN** an administrator opens the administrative track workspace
- **THEN** the system offers no gear control there
- **AND** it delivers no gear record to that surface
