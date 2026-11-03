# outdoor-routes Specification

## Purpose

Defines a route as the owner of reusable track geometry: the GPX file and parsed metadata for a shape that several tracks can share, with no recording data of its own.

## Requirements

### Requirement: A route stores geometry without recording data

The system SHALL store a route as geometry only: a GPX file, its parsed metadata, a title, and an optional description, owned by one user. A route SHALL NOT store a recording start, a duration, a timezone, gear, an activity type, or a publication status. The system SHALL keep the route's file under the same visibility and lifecycle rules as a track's file.

#### Scenario: Owner creates a route from placed points

- **WHEN** a signed-in owner places at least two points on the map and saves them as a route
- **THEN** the system stores a route with a GPX file built from those points
- **AND** the route carries no recording start, duration, timezone, gear, or activity type

#### Scenario: Route carries no time-related field

- **WHEN** the system loads a route for display or for a linked track
- **THEN** every time-related value shown or returned comes from the track, not from the route

### Requirement: A route is the geometry source for its linked tracks

The system SHALL resolve a linked track's geometry — its GPX file and its parsed metadata — from the route when the track carries no file of its own. When a track owns its file, the system SHALL resolve geometry from the track and SHALL NOT consult any route.

#### Scenario: Route-based track inherits geometry

- **WHEN** a track is created from a route
- **THEN** the track stores no file and no metadata of its own
- **AND** its map, summary, and GPX download resolve to the route's file and metadata

#### Scenario: Route edit reaches every linked track

- **WHEN** the geometry of a route with linked tracks is edited
- **THEN** every linked track displays the edited geometry
- **AND** no track keeps a stale copy of the previous geometry

#### Scenario: Deleting a track leaves its route

- **WHEN** an owner deletes a route-based track
- **THEN** the track is removed
- **AND** its route remains with its geometry intact

### Requirement: The owner manages a route library

The system SHALL give each signed-in owner a route library at `/my/routes` that lists only their own routes, shows how many tracks reference each route, lets them preview a route's shape, and lets them create, rename, edit, and delete a route.

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

#### Scenario: Owner edits a route description

- **WHEN** a signed-in owner changes a route's description
- **THEN** the new description is stored and shown in the library
- **AND** the route's title, file, and geometry are unchanged

#### Scenario: Owner previews a route

- **WHEN** a signed-in owner opens the preview for a route
- **THEN** the surface draws the route's shape from its stored geometry
- **AND** a route without parseable geometry shows a fallback message instead of an empty map

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

The system SHALL refuse to delete a route that still has linked tracks, SHALL report how many tracks keep it in use, and SHALL leave the route and its tracks unchanged. When an unused route is deleted, the system SHALL remove the route and retire its stored GPX file together, with no partial result.

#### Scenario: Owner attempts to delete a route in use

- **WHEN** an owner attempts to delete a route that still has linked tracks
- **THEN** the delete action is unavailable and the surface states how many tracks use the route
- **AND** the route and its tracks are unchanged

#### Scenario: Owner deletes an unused route

- **WHEN** an owner deletes a route with no linked tracks
- **THEN** the route is removed from the library
- **AND** it no longer appears in the track creation dialog's route picker
- **AND** its stored GPX file is retired rather than left active
