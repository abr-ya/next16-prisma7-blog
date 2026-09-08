## Purpose

Defines invitation-backed trip participation so owners can invite known existing users by email and users retain explicit control over accepting membership.

## ADDED Requirements

### Requirement: Trip owners and administrators can invite existing users by email
The system SHALL let a trip owner or authenticated administrator create a pending trip invitation by entering the email address of an existing site user, without revealing user-directory results or personal details beyond the invitation outcome.

#### Scenario: Owner invites an existing user
- **WHEN** a signed-in owner enters the email of another existing user for their trip
- **THEN** the system creates one pending invitation for that trip and user
- **AND** the invited user does not become a participant until accepting it

#### Scenario: Administrator invites a user
- **WHEN** an authenticated administrator enters the email of an existing user for any trip
- **THEN** the system creates a pending invitation under the same acceptance rules

#### Scenario: Email does not identify an account
- **WHEN** an owner or administrator enters an email with no matching site account
- **THEN** the system reports that the user cannot be invited
- **AND** it does not create an invitation or disclose account-directory information

#### Scenario: Invite is invalid or redundant
- **WHEN** an owner or administrator attempts to invite the trip owner, an accepted participant, or a user who already has a pending invitation
- **THEN** the system rejects the request without creating a duplicate invitation or membership

### Requirement: Invited users control invitation acceptance
The system SHALL provide authenticated users a private trip invitation inbox where they can view their own pending invitations and accept or decline each invitation.

#### Scenario: Invited user reviews invitations
- **WHEN** a signed-in user opens `/trips/invitations`
- **THEN** the system shows only that user's pending invitations with enough trip information to make a decision
- **AND** it does not expose other users' invitations or trip participant data

#### Scenario: Invited user accepts
- **WHEN** the invited signed-in user accepts their pending invitation
- **THEN** the system records accepted membership for that user and trip
- **AND** the invitation no longer appears as pending

#### Scenario: Invited user declines
- **WHEN** the invited signed-in user declines their pending invitation
- **THEN** the system records the declined state
- **AND** the user receives no participant permissions for that trip

#### Scenario: Other user responds to invitation
- **WHEN** a user attempts to accept or decline an invitation addressed to another account
- **THEN** the system rejects the request
- **AND** the invitation state remains unchanged

### Requirement: Owners and administrators manage pending and accepted participation
The system SHALL let the trip owner or an authenticated administrator view participant invitation state, cancel pending invitations, and remove accepted participants for the trip.

#### Scenario: Authorized manager views participation state
- **WHEN** a trip owner or administrator opens the trip participation controls
- **THEN** the system shows the trip's pending invitations and accepted participants
- **AND** it does not expose those controls or the participant list publicly

#### Scenario: Authorized manager cancels a pending invitation
- **WHEN** a trip owner or administrator cancels a pending invitation for the trip
- **THEN** the invitation can no longer be accepted
- **AND** no membership is created

#### Scenario: Authorized manager removes an accepted participant
- **WHEN** a trip owner or administrator removes an accepted participant
- **THEN** that user no longer has active membership or participant permissions for the trip
- **AND** trip records and any content previously contributed by the user remain preserved

#### Scenario: Unauthorized user manages participation
- **WHEN** an anonymous user, non-owner, or non-administrator attempts to manage another trip's invitations or participants
- **THEN** the system rejects the request
- **AND** invitation and membership state remain unchanged

### Requirement: Accepted membership is the participant authorization source
The system SHALL treat only an accepted, active trip invitation as participant membership for trip-scoped authorization; pending, declined, cancelled, and expired invitations SHALL grant no participant permissions.

#### Scenario: Accepted participant is authorized for future contribution capabilities
- **WHEN** a future trip-scoped contribution capability checks whether a user is a participant
- **THEN** it recognizes an accepted active membership for that trip
- **AND** it does not recognize any non-accepted invitation state

#### Scenario: Invitation lifecycle preserves data integrity
- **WHEN** a trip or user is deleted through existing authorized lifecycle behavior
- **THEN** related invitation and membership records are removed with that parent record
- **AND** unrelated users, trips, and existing media associations are preserved
