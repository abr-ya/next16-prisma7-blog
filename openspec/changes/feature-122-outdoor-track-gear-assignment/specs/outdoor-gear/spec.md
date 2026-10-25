# Spec Delta

## MODIFIED Requirements

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
