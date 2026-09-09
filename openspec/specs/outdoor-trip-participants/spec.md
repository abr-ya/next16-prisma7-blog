## Purpose

Defines invitation-backed trip participation so owners can invite existing users by email and users explicitly accept membership.

## Requirements

### Requirement: Trip owners and administrators can invite existing users by email
The system SHALL let a trip owner or authenticated administrator create a pending trip invitation by entering the email address of an existing site user.

#### Scenario: Owner invites an existing user
- **WHEN** a signed-in owner enters another existing user's email for their trip
- **THEN** the system creates one pending invitation and grants no membership before acceptance

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

### Requirement: Owners and administrators manage participation
The system SHALL let the trip owner or an authenticated administrator view invitation state, cancel pending invitations, and remove accepted participants privately.

#### Scenario: Unauthorized user manages participation
- **WHEN** an anonymous user, non-owner, or non-administrator attempts to manage another trip's participation
- **THEN** the system rejects the request and preserves invitation and membership state

### Requirement: Accepted membership is the participant authorization source
The system SHALL treat only an accepted active invitation as trip participant membership; all other invitation states grant no participant permissions.

#### Scenario: Accepted participant is authorized
- **WHEN** a future trip-scoped capability checks membership
- **THEN** it recognizes accepted active membership only
