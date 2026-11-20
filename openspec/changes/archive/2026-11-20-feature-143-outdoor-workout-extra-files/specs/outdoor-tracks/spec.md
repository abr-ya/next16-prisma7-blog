# Spec Delta

## ADDED Requirements

### Requirement: The owner manages extra GPX files on a ready workout

The owner SHALL be able to attach a secondary GPX file to their own `READY` workout and remove one again, up to five secondary files per workout. An added file SHALL be parsed into its geometry metadata so the existing map and download surfaces pick it up. Removing a secondary file SHALL retire its file asset instead of deleting it. A file that belongs to another track, is already used as a primary file, or is already attached, SHALL be refused. A pending draft SHALL not accept secondary files. Primary geometry statistics SHALL NOT change when a secondary file is added or removed.

#### Scenario: The owner adds an extra file

- **WHEN** the owner attaches an uploaded GPX file to a ready workout
- **THEN** the file appears in the workout's secondary file list
- **AND** its parsed line appears on the track map when the parse succeeded
- **AND** the primary distance, time, and laps stay unchanged

#### Scenario: An extra file is added to a route-based workout

- **WHEN** the owner adds a secondary file to a workout whose primary geometry is a route
- **THEN** the route remains the primary geometry
- **AND** the extra file is listed and drawn beside it
- **AND** removing the extra file never touches the route's own file

#### Scenario: The owner removes an extra file

- **WHEN** the owner removes a secondary file
- **THEN** it disappears from the list and from the map
- **AND** its file asset is marked for deletion
- **AND** the primary geometry and its file stay active

#### Scenario: The five-file cap is enforced

- **WHEN** a workout already has five secondary files and the owner tries to add another
- **THEN** the system refuses the add with a readable message
- **AND** the existing files stay unchanged

#### Scenario: A duplicate or foreign file is refused

- **WHEN** the chosen file is already attached to a track or another geometry, belongs to somebody else, or is not an active GPX file
- **THEN** the system refuses the add with a validation message
- **AND** no geometry row is created

#### Scenario: A pending draft cannot take extra files

- **WHEN** the owner tries to add a secondary file to a pending draft
- **THEN** the system refuses it with a validation message
- **AND** the draft stays as it was

#### Scenario: Other viewers get the list without controls

- **WHEN** a viewer who does not own the workout opens the page
- **THEN** the stored secondary files are listed under the existing download rules
- **AND** no add or remove control is shown
