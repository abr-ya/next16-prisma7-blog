# Spec Delta

## MODIFIED Requirements

### Requirement: Signed-in users can toggle one like per eligible photo

The system SHALL allow a signed-in user to add or remove exactly one like for a photo that is publicly eligible through the current published trip, except that the photo's owner SHALL NOT add a like to their own photo. The system SHALL show that user's current liked state without exposing it to other visitors.

#### Scenario: Signed-in user likes a photo

- **WHEN** a signed-in user selects the like control for an eligible photo owned by another user that they have not liked
- **THEN** the system records one like for that user and photo
- **AND** that user's control state updates to liked

#### Scenario: Photo owner cannot like their own photo

- **WHEN** a signed-in user selects the like control for an eligible photo they own
- **THEN** the system rejects the like mutation without writing a like
- **AND** it does not expose private information about the trip or other users

#### Scenario: Signed-in user removes their like

- **WHEN** a signed-in user selects the like control for an eligible photo they have already liked
- **THEN** the system removes their like
- **AND** that user's control state updates to unliked

#### Scenario: Duplicate request preserves one-like rule

- **WHEN** repeated or concurrent like requests are made by the same signed-in user for the same eligible photo owned by another user
- **THEN** the system persists no more than one like for that user and photo
- **AND** that user's control resolves to the persisted liked state
