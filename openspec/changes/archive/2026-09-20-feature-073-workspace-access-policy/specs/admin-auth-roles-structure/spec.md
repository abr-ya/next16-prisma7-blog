## ADDED Requirements

### Requirement: Active workspace roles are explicit
The system SHALL treat persisted `user` and `admin` as the only active application roles. The `user` role SHALL provide authenticated personal-workspace access subject to resource ownership, while the `admin` role SHALL provide the administrator override and sensitive control capabilities defined by the workspace access policy.

#### Scenario: Newly registered user enters the workspace
- **WHEN** a user signs in with the ordinary persisted `user` role
- **THEN** the user can access only personal workspace capabilities and explicitly granted trip participation workflows
- **AND** the user does not receive administrator controls merely by entering `/admin`

#### Scenario: Administrator enters the workspace
- **WHEN** a user with the persisted `admin` role signs in
- **THEN** the user receives the administrator capabilities defined by the workspace access policy
- **AND** the authorization decision is performed server-side
