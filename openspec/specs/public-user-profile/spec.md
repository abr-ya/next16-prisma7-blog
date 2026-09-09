## Purpose

Provides every signed-in user with a private read-only profile for their identity, personal content, and trip invitations.

## Requirements

### Requirement: Signed-in users can access a private profile
The system SHALL provide a `/profile` page to an authenticated user and SHALL deny anonymous access without exposing another user's profile data.

#### Scenario: Signed-in user opens profile
- **WHEN** an authenticated user navigates to `/profile`
- **THEN** the system displays only that user's identity, personal summary, and pending invitations

#### Scenario: Anonymous visitor opens profile
- **WHEN** an anonymous visitor navigates to `/profile`
- **THEN** the system requires authentication and does not reveal profile data

### Requirement: Profile displays existing identity information
The system SHALL display the authenticated user's current display name, email address, and avatar when one exists. The profile SHALL use the standard name-based avatar fallback when no avatar exists and SHALL not provide identity-editing controls.

#### Scenario: User has an existing avatar
- **WHEN** an authenticated user with an avatar opens their profile
- **THEN** the system displays their current name, email address, and avatar

#### Scenario: User has no avatar
- **WHEN** an authenticated user without an avatar opens their profile
- **THEN** the system displays the standard name-based avatar fallback and no avatar-management controls

### Requirement: Profile summarizes personal content
The system SHALL show an authenticated user lightweight counts and links for content they own: posts, trips, tracks, and photos. Each count SHALL be scoped to the current user and SHALL include a clear empty state when that content type has no records.

#### Scenario: User has personal content
- **WHEN** an authenticated user with owned posts, trips, tracks, or photos opens their profile
- **THEN** the system displays the current count and an applicable destination for each content type

#### Scenario: User has no records of a content type
- **WHEN** an authenticated user opens their profile with zero owned records for a content type
- **THEN** the system displays a zero count and an explicit empty-state message for that type

### Requirement: Profile renders the private invitation inbox
The system SHALL display only the authenticated user's pending trip invitations directly in their Profile and SHALL provide accept and decline actions for each invitation.

#### Scenario: User has pending invitations
- **WHEN** an authenticated user with pending trip invitations opens their profile
- **THEN** the system displays each pending invitation with accept and decline controls

#### Scenario: User has no pending invitations
- **WHEN** an authenticated user without pending trip invitations opens their profile
- **THEN** the system displays a clear no-invitations state

### Requirement: Public navigation exposes the profile destination
The signed-in public navigation user menu SHALL provide a Profile destination and SHALL keep existing account controls available.

#### Scenario: Signed-in user opens account navigation
- **WHEN** an authenticated user opens the public navigation user menu
- **THEN** the menu includes a link to `/profile` alongside the existing dashboard and sign-out controls
