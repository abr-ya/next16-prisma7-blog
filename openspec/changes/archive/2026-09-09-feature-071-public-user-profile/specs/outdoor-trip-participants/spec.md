## MODIFIED Requirements

### Requirement: Invited users control invitation acceptance
The system SHALL provide authenticated users a private invitation inbox directly within their Profile where they can view and accept or decline only their own pending invitations. The system SHALL retain `/trips/invitations` as a compatible authenticated destination for the same inbox.

#### Scenario: Invited user opens Profile
- **WHEN** an invited signed-in user opens their Profile
- **THEN** the system displays only that user's pending trip invitations with accept and decline controls

#### Scenario: Invited user accepts
- **WHEN** the invited signed-in user accepts their pending invitation
- **THEN** the system records accepted membership for that user and trip

#### Scenario: Other user responds to invitation
- **WHEN** a user attempts to respond to an invitation addressed to another account
- **THEN** the system rejects the request and preserves its state
