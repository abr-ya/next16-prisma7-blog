## Purpose

Lets signed-in visitors express a lightweight, private-to-them appreciation of published trip photos while everyone can see aggregate interest.

## ADDED Requirements

### Requirement: Eligible published trip photos show aggregate likes
The system SHALL show the total number of likes for every published photo displayed through a published trip. The count SHALL reveal no liker identities and SHALL remain available to anonymous visitors.

#### Scenario: Visitor views a published trip photo
- **WHEN** an anonymous or signed-in visitor opens a published trip containing a published linked photo
- **THEN** the photo displays its current total like count
- **AND** the page does not disclose which accounts liked it

#### Scenario: Ineligible photo is not a public like target
- **WHEN** a photo or its trip association is not publicly eligible
- **THEN** the system does not expose a public like control or count through that surface

### Requirement: Signed-in users can toggle one like per eligible photo
The system SHALL allow a signed-in user to add or remove exactly one like for a photo that is publicly eligible through the current published trip. The system SHALL show that user's current liked state without exposing it to other visitors.

#### Scenario: Signed-in user likes a photo
- **WHEN** a signed-in user selects the like control for an eligible photo they have not liked
- **THEN** the system records one like for that user and photo
- **AND** the displayed count and that user's state update to liked

#### Scenario: Signed-in user removes their like
- **WHEN** a signed-in user selects the like control for an eligible photo they have already liked
- **THEN** the system removes their like
- **AND** the displayed count and that user's state update to unliked

#### Scenario: Duplicate request preserves one-like rule
- **WHEN** repeated or concurrent like requests are made by the same signed-in user for the same photo
- **THEN** the system persists no more than one like for that user and photo
- **AND** the aggregate count does not include duplicate likes

### Requirement: Like mutations preserve visibility and data boundaries
The system SHALL authorize every like mutation against the current session and the photo's current public trip eligibility. It SHALL preserve likes only as a user-to-photo relationship and SHALL remove them when either related record is deleted.

#### Scenario: Anonymous or unauthorized mutation is rejected
- **WHEN** an anonymous visitor or a signed-in user targets a photo that is not currently eligible through the specified published trip
- **THEN** the system rejects the mutation
- **AND** it does not reveal private photo, trip, or relationship data

#### Scenario: Related photo or user is deleted
- **WHEN** a liked photo or the account that liked it is deleted
- **THEN** related like records are deleted with it
- **AND** no orphaned likes remain
