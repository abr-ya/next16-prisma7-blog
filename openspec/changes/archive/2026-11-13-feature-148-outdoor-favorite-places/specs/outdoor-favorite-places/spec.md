# Spec Delta

## Purpose

Defines the owner's private list of saved places — the familiar spots they start their walks from — with the owner's own create, rename, and delete over that list.

## ADDED Requirements

### Requirement: Owners manage a private list of saved places

The system SHALL let a signed-in owner create, list, rename, and delete their own saved places, and SHALL scope every one of those operations to the records that belong to the signed-in owner. Saved places SHALL stay private: no saved place is listed for another owner, and no saved place appears on a public page.

#### Scenario: Owner creates a saved place

- **WHEN** a signed-in owner saves a new saved place with a name and a coordinate
- **THEN** the system stores it as a saved place owned by that owner
- **AND** it lists the place among that owner's saved places

#### Scenario: Owner lists their saved places

- **WHEN** a signed-in owner opens their saved places page
- **THEN** the system shows only the saved places that belong to that owner
- **AND** it shows no saved place belonging to any other owner

#### Scenario: Owner renames a saved place

- **WHEN** a signed-in owner changes the name of one of their saved places
- **THEN** the system stores the new name on that record
- **AND** it leaves the record's coordinate, ownership, and creation date unchanged

#### Scenario: Owner deletes a saved place

- **WHEN** a signed-in owner deletes one of their saved places
- **THEN** the system removes that record
- **AND** it leaves every other owner's saved places untouched

#### Scenario: Another owner's saved place is out of reach

- **WHEN** a signed-in owner tries to rename or delete a saved place owned by somebody else
- **THEN** the system refuses the operation
- **AND** it leaves that record unchanged

#### Scenario: Anonymous visitor requests the saved places page

- **WHEN** an unauthenticated visitor requests the saved places page
- **THEN** the system requires authentication instead of rendering the page
- **AND** it returns no saved places

### Requirement: A saved place carries a name and one coordinate

The system SHALL store each saved place with a name the owner typed and a single coordinate pair. The name SHALL be non-empty and no longer than 120 characters. The latitude SHALL lie within -90 to 90 and the longitude within -180 to 180.

#### Scenario: Owner drops a coordinate on the map

- **WHEN** the owner drops a point on the map in the saved-place form
- **THEN** the form holds that coordinate as the place's coordinate
- **AND** the owner can move the point before saving the place

#### Scenario: Owner saves a place without a name

- **WHEN** a signed-in owner saves a saved place with an empty name
- **THEN** the system refuses the save
- **AND** it stores no record

#### Scenario: Owner saves a place with a coordinate out of range

- **WHEN** a signed-in owner saves a saved place whose latitude is outside -90 to 90 or whose longitude is outside -180 to 180
- **THEN** the system refuses the save
- **AND** it stores no record
