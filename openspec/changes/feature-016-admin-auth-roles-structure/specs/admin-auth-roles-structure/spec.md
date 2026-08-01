## ADDED Requirements

### Requirement: Current auth inventory

The system SHALL document the current registration and authentication surface before role-gated admin behavior is implemented.

#### Scenario: Current auth providers are documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify that email/password, Google, and GitHub auth are configured through better-auth

#### Scenario: Current auth routes are documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify the sign-in, sign-up, and better-auth API routes used by the application

#### Scenario: Current admin boundary is documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify that `/admin` is currently protected by session presence rather than a role check

### Requirement: Role model planning

The system SHALL define the first role model before implementing role-gated admin access.

#### Scenario: Minimal role vocabulary is defined

- **WHEN** the role model is planned
- **THEN** it SHALL define a minimal vocabulary for administrators and ordinary authenticated users
- **AND** ordinary authenticated users SHALL retain access to creator-owned workspace features

#### Scenario: Existing users receive safe defaults

- **WHEN** a future role implementation adds persisted roles
- **THEN** the plan SHALL define how existing users receive a safe default role

#### Scenario: New users receive creator role by default

- **WHEN** a future role implementation creates a new user through public registration or a social provider
- **THEN** the planned authorization model SHALL assign the ordinary authenticated user role by default

#### Scenario: Provider does not imply role

- **WHEN** users authenticate through email/password, Google, or GitHub
- **THEN** the planned authorization model SHALL NOT grant admin access solely because of the provider used

### Requirement: Registration policy planning

The system SHALL decide how registration should behave before roles are used for sensitive admin features.

#### Scenario: Public registration is evaluated

- **WHEN** the registration policy is planned
- **THEN** it SHALL decide whether public sign-up remains open, becomes invite-only, or remains open with non-admin defaults

#### Scenario: Incomplete auth flows are identified

- **WHEN** the registration and auth surface is reviewed
- **THEN** the plan SHALL identify whether email verification, password reset, account settings, invite flow, and provider account linking are included or deferred

### Requirement: Admin-only dependency boundaries

The system SHALL define which future features depend on role-gated admin access and which creator-owned surfaces stay session-gated.

#### Scenario: Admin shell remains creator workspace

- **WHEN** roles are planned for the admin area
- **THEN** the plan SHALL keep creator-owned `/admin` workflows available to authenticated users
- **AND** it SHALL NOT require the entire `/admin` layout to become administrator-only

#### Scenario: Global settings wait for roles

- **WHEN** a future feature adds global UploadThing or file settings
- **THEN** that feature SHALL depend on role-gated admin access rather than session-only access

#### Scenario: Current file foundation can stay session-gated

- **WHEN** the minimal file foundation is implemented before roles
- **THEN** it MAY use the existing `/admin` session boundary
- **AND** it SHALL NOT add sensitive global settings before role-gated admin access exists

#### Scenario: Sensitive operations are role-gated

- **WHEN** a future feature adds role management, all-user file views, database backups, global storage settings, or moderation of other users' content
- **THEN** that feature SHALL require an administrator role check
