## Purpose

Makes the public trip list immediately explain each visitor's relationship to a published trip without revealing private membership information.

## Requirements

### Requirement: Published trip cards identify the viewer relationship
The system SHALL show one concise relationship label on every published trip card in the public `/trips` list. A card owned by the signed-in viewer SHALL show `My trip`; a card for which that viewer has accepted active participation SHALL show `Participant`; every other card SHALL show `Public trip`.

#### Scenario: Owner views their published trip
- **WHEN** a signed-in user opens `/trips` and a published trip is owned by that user
- **THEN** that trip card displays `My trip`
- **AND** it does not display the participant or public-trip label

#### Scenario: Accepted participant views a trip
- **WHEN** a signed-in user opens `/trips` and has accepted active participation for a published trip they do not own
- **THEN** that trip card displays `Participant`
- **AND** it does not display the owner or public-trip label

#### Scenario: Visitor views an unrelated public trip
- **WHEN** an anonymous visitor or a signed-in user without ownership or accepted active participation opens `/trips`
- **THEN** that published trip card displays `Public trip`

#### Scenario: Pending, declined, removed, or expired invitation is not membership
- **WHEN** a signed-in user opens `/trips` with a pending, declined, removed, or expired invitation for a published trip
- **THEN** that trip card displays `Public trip`
- **AND** the card does not imply participant access

### Requirement: Relationship labels preserve public trip boundaries
The system SHALL derive relationship labels only for the current signed-in viewer and SHALL preserve the existing published-trip listing, card content, detail navigation, and visibility rules.

#### Scenario: Visitor views the list without private membership disclosure
- **WHEN** a visitor opens `/trips`
- **THEN** each card exposes only that visitor's applicable relationship label
- **AND** it does not reveal another user's ownership, invitation, or participant status
