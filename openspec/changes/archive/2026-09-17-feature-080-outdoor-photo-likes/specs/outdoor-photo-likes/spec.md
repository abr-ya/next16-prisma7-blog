## Purpose

Lets signed-in visitors express a lightweight, private-to-them appreciation of published trip photos without exposing public popularity metrics.

## ADDED Requirements

### Requirement: Eligible published trip photos show an unobtrusive like control
The system SHALL show a semi-transparent like control in the top-right corner of every published photo displayed through a published trip. It SHALL not show a public total-like count or disclose liker identities.

#### Scenario: Visitor views a published trip photo
- **WHEN** an anonymous or signed-in visitor opens a published trip containing a published linked photo
- **THEN** the photo displays a top-right like control without a public total-like count
- **AND** the page does not disclose which accounts liked it

#### Scenario: Ineligible photo is not a public like target
- **WHEN** a photo or its trip association is not publicly eligible
- **THEN** the system does not expose a public like control through that surface

### Requirement: Signed-in users can toggle one like per eligible photo
The system SHALL allow a signed-in user to add or remove exactly one like for a photo that is publicly eligible through the current published trip. The system SHALL show that user's current liked state without exposing it to other visitors.

#### Scenario: Signed-in user likes a photo
- **WHEN** a signed-in user selects the like control for an eligible photo they have not liked
- **THEN** the system records one like for that user and photo
- **AND** that user's control state updates to liked

#### Scenario: Signed-in user removes their like
- **WHEN** a signed-in user selects the like control for an eligible photo they have already liked
- **THEN** the system removes their like
- **AND** that user's control state updates to unliked

#### Scenario: Duplicate request preserves one-like rule
- **WHEN** repeated or concurrent like requests are made by the same signed-in user for the same photo
- **THEN** the system persists no more than one like for that user and photo
- **AND** that user's control resolves to the persisted liked state

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

### Requirement: Signed-in users can privately read their eligible liked photos
The system SHALL provide a server-side read that returns the current signed-in user's liked photos that remain publicly eligible through a published trip. It SHALL not expose another user's liked-photo collection, liker identities, or withdrawn private content.

#### Scenario: Signed-in user reads their liked photos
- **WHEN** a signed-in user requests their liked-photo collection
- **THEN** the system returns only that user's likes for currently eligible published trip photos
- **AND** each result contains only the photo and public trip data needed by a future private UI

#### Scenario: Anonymous or ineligible collection read is protected
- **WHEN** an anonymous visitor requests the liked-photo collection, or a previously liked photo is no longer publicly eligible
- **THEN** the system rejects the anonymous request or omits the ineligible photo respectively
- **AND** it does not disclose private photo, trip, relationship, or liker data
