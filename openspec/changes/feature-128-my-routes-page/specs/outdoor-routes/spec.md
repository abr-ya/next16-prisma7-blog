# Spec Delta

## ADDED Requirements

### Requirement: The owner manages a route library

The system SHALL give each signed-in owner a route library at `/my/routes` that lists only their own routes, shows how many tracks reference each route, and lets them create, rename, edit, and delete a route.

#### Scenario: Owner opens the route library

- **WHEN** a signed-in owner opens `/my/routes`
- **THEN** the library lists only that owner's routes
- **AND** each row shows the route title, its description, its creation date, and the number of tracks linked to it
- **AND** a route owned by another user is never listed

#### Scenario: Owner creates a route from the library

- **WHEN** a signed-in owner uses **New route** and places at least two points
- **THEN** the route appears in the library with a track count of zero
- **AND** it is available in the track creation dialog's route picker

#### Scenario: Owner renames a route

- **WHEN** a signed-in owner renames a route
- **THEN** the new title is stored and shown in the library
- **AND** the route's file and geometry are unchanged

### Requirement: A shared route edit warns before it reaches every linked track

The system SHALL warn the owner before saving a geometry change to a route that is linked to more than one track, and SHALL name how many tracks the change will affect. The system SHALL NOT require that warning when exactly one track is linked.

#### Scenario: Owner edits geometry of a shared route

- **WHEN** an owner opens the geometry editor for a route linked to more than one track
- **THEN** the surface warns that the change applies to every linked track before the change is saved
- **AND** the warning names the number of linked tracks

#### Scenario: Owner edits geometry of a single-use route

- **WHEN** an owner opens the geometry editor for a route linked to exactly one track
- **THEN** the surface shows no shared-track warning

#### Scenario: Owner confirms a shared edit

- **WHEN** the owner confirms the warning and saves
- **THEN** every linked track displays the edited geometry

### Requirement: A route with linked tracks cannot be deleted

The system SHALL refuse to delete a route that still has linked tracks, SHALL report how many tracks keep it in use, and SHALL leave the route and its tracks unchanged.

#### Scenario: Owner attempts to delete a route in use

- **WHEN** an owner attempts to delete a route that still has linked tracks
- **THEN** the delete action is unavailable and the surface states how many tracks use the route
- **AND** the route and its tracks are unchanged

#### Scenario: Owner deletes an unused route

- **WHEN** an owner deletes a route with no linked tracks
- **THEN** the route is removed from the library
- **AND** it no longer appears in the track creation dialog's route picker
