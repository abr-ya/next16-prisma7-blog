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
