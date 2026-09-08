## MODIFIED Requirements

### Requirement: Hike creator can manage participants
The system SHALL let a hike creator or authenticated administrator manage invitation-backed participation for that hike, where an invited existing user becomes a participant only after accepting their invitation.

#### Scenario: Creator adds a participant

- **WHEN** the signed-in creator of a hike invites another existing user by email
- **THEN** the system creates a pending invitation for that user
- **AND** it does not grant participant contribution permissions before acceptance

#### Scenario: Invited user becomes a participant

- **WHEN** the invited user accepts their pending hike invitation while signed in to the invited account
- **THEN** that user becomes a participant for the hike
- **AND** the participant receives hike-scoped contribution permissions defined for accepted participants

#### Scenario: Creator removes a participant

- **WHEN** the signed-in creator of a hike removes an accepted participant from that hike
- **THEN** the removed user no longer has participant contribution permissions for that hike
- **AND** content already contributed by that user remains preserved unless removed through an explicit management action

#### Scenario: Administrator manages participation

- **WHEN** an authenticated administrator manages invitations or accepted participants for any hike
- **THEN** the system permits the action under the same invitation and membership rules

#### Scenario: Non-creator manages participants

- **WHEN** a signed-in user who is neither the hike creator nor an admin attempts to create, cancel, accept on behalf of another user, or remove hike participation
- **THEN** the system rejects the request
- **AND** the participant list remains unchanged
