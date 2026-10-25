# outdoor-gear Specification

## Purpose

Defines a private, owner-only inventory of personal equipment — the shoes, bicycles, and other gear an owner uses for their tracks — with the owner's own create, view, edit, and delete over it.

## Requirements

### Requirement: Owners manage a private gear inventory

The system SHALL let a signed-in owner create, list, view, edit, and delete their own gear records, and SHALL scope every one of those operations to the records that belong to the signed-in owner. The system SHALL refuse to delete a gear record that is still attached to a track of the same owner until that attachment is cleared.

#### Scenario: Owner creates a gear item

- **WHEN** a signed-in owner saves a new gear item with a name
- **THEN** the system stores it as a gear record owned by that owner
- **AND** it lists the item among that owner's gear

#### Scenario: Owner lists their gear

- **WHEN** a signed-in owner opens their gear page
- **THEN** the system shows only the gear records that belong to that owner
- **AND** it shows no gear belonging to any other owner

#### Scenario: Owner edits a gear item

- **WHEN** a signed-in owner changes the name or the activity types of one of their gear records
- **THEN** the system stores the change on that record
- **AND** it leaves the record's ownership and creation date unchanged

#### Scenario: Owner deletes a gear item

- **WHEN** a signed-in owner deletes one of their gear records that is not attached to a track
- **THEN** the system removes that record
- **AND** it leaves every other owner's gear untouched

#### Scenario: Owner deletes a gear item that is attached to a track

- **WHEN** a signed-in owner deletes one of their gear records that is still attached to one of their tracks
- **THEN** the system refuses the deletion
- **AND** it reports that the attachment has to be cleared first
- **AND** it leaves the gear record and every track untouched

#### Scenario: Anonymous visitor requests a gear page

- **WHEN** an unauthenticated visitor requests the gear page
- **THEN** the system requires authentication instead of rendering the gear page
- **AND** it returns no gear records

### Requirement: Gear records carry a name and optional activity types

The system SHALL store a required display name on every gear record and SHALL allow any number of activity types drawn from the active activity-type list, including none at all.

#### Scenario: Owner names a gear item

- **WHEN** a signed-in owner saves a gear item whose name is not empty after trimming
- **THEN** the system accepts the name as the gear item's display name
- **AND** it preserves the name exactly as given, apart from surrounding whitespace

#### Scenario: Owner submits an empty gear name

- **WHEN** a signed-in owner saves a gear item whose name is empty or only whitespace
- **THEN** the system rejects the save with a validation error
- **AND** it creates no gear record

#### Scenario: Owner submits an over-long gear name

- **WHEN** a signed-in owner saves a gear item whose name exceeds the maximum length the system accepts
- **THEN** the system rejects the save with a validation error
- **AND** it creates no gear record

#### Scenario: Owner classifies a gear item with one activity type

- **WHEN** a signed-in owner saves a gear item with one active activity type
- **THEN** the system stores the association on that gear record
- **AND** it displays that activity type alongside the item in the owner's gear list

#### Scenario: Owner classifies a gear item with several activity types

- **WHEN** a signed-in owner saves a gear item with more than one active activity type
- **THEN** the system stores every one of those associations on that gear record
- **AND** it displays each of them alongside the item in the owner's gear list

#### Scenario: Owner saves a gear item without an activity type

- **WHEN** a signed-in owner saves a gear item without selecting any activity type
- **THEN** the system saves the item as unclassified
- **AND** it does not require a synthetic "not selected" activity-type record

#### Scenario: Owner removes an activity type from a gear item

- **WHEN** a signed-in owner saves a gear item with one of its previously selected activity types removed
- **THEN** the system drops that association from the gear record
- **AND** it keeps the associations the owner left selected

#### Scenario: Owner submits an inactive or missing activity type

- **WHEN** a signed-in owner saves a gear item with an activity type that is inactive or does not exist
- **THEN** the system rejects the save with a validation error
- **AND** it preserves the gear record's previous classification when the item already had one

#### Scenario: An assigned activity type is later deactivated

- **WHEN** an administrator deactivates an activity type that a gear record already uses
- **THEN** the system keeps the gear record's existing classification
- **AND** it stops offering that type for new gear selections

#### Scenario: Owner edits a gear item whose activity type was deactivated

- **WHEN** a signed-in owner saves a change to a gear record whose activity type was deactivated after it was attached
- **THEN** the system accepts the save
- **AND** it keeps that activity type attached to the record

### Requirement: Gear mutations are refused for gear the caller does not own

The system SHALL refuse any attempt to read, modify, or delete a gear record that does not belong to the signed-in caller.

#### Scenario: Owner submits another owner's gear for editing

- **WHEN** a signed-in user submits an update for a gear record owned by a different user
- **THEN** the system rejects the update
- **AND** it leaves the gear record unchanged

#### Scenario: Owner submits another owner's gear for deletion

- **WHEN** a signed-in user submits a delete for a gear record owned by a different user
- **THEN** the system rejects the deletion
- **AND** the gear record still exists

### Requirement: Gear data stays private to its owner

The system SHALL keep every gear record out of public pages, public track representations, shared feeds, and administrative listings.

#### Scenario: A visitor browses the public site

- **WHEN** a visitor browses the public pages of the site
- **THEN** no public page lists a gear name, a gear activity type, or a gear count
- **AND** no public page exposes an identifier that would let a visitor read a gear record

#### Scenario: An administrator browses the site

- **WHEN** an administrator opens an administrative listing of the site's content
- **THEN** no listing includes the owners' personal gear records
- **AND** the gear records remain reachable only through their owners' own gear page
