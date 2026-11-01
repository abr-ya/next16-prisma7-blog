# Spec Delta

## ADDED Requirements

### Requirement: A track's geometry has exactly one source

The system SHALL keep exactly one geometry source per track: either the track's own GPX file and parsed metadata, or one linked route. A track SHALL NOT hold a file and a linked route at the same time, and SHALL NOT hold neither. The system SHALL enforce this rule in the database as well as in the creation actions.

#### Scenario: Uploaded track owns its geometry

- **WHEN** a signed-in owner uploads a GPX file through the main track path
- **THEN** the stored track carries its own file and its own parsed metadata
- **AND** the track has no linked route
- **AND** its behavior is unchanged from before this change

#### Scenario: Manual track borrows geometry from a route

- **WHEN** a track is created from a route
- **THEN** the track stores no file and no metadata of its own
- **AND** it stores the linked route
- **AND** its recording data is entered by the owner, not parsed from a file

#### Scenario: The database rejects a track with no geometry source

- **WHEN** a write would leave a track with neither its own file nor a linked route
- **THEN** the database rejects the write

#### Scenario: The database rejects two geometry sources on one track

- **WHEN** a write would give a track both its own file and a linked route
- **THEN** the database rejects the write

### Requirement: Manual track creation starts from a route

The system SHALL create a track without an uploaded file only from a route, either newly placed or already in the owner's library, and SHALL require the recording start and the duration before the track can be saved.

#### Scenario: Owner creates a track from an existing route

- **WHEN** a signed-in owner chooses an existing route and submits a recording start and a duration
- **THEN** the system stores a track linked to that route
- **AND** the track appears in the owner's tracks with the route's geometry

#### Scenario: Owner creates a track from a new route

- **WHEN** a signed-in owner places points for a new route and submits a recording start and a duration
- **THEN** the system stores the route and a track linked to it
- **AND** the route appears in the owner's route library with one linked track

#### Scenario: Recording data is incomplete

- **WHEN** a signed-in owner submits manual track creation without a recording start or without a duration
- **THEN** the system refuses the save with a validation message
- **AND** no track is stored

#### Scenario: One route backs several tracks

- **WHEN** a signed-in owner creates a second track from a route that already has a linked track
- **THEN** both tracks stay linked to the same route
- **AND** the route reports two linked tracks
