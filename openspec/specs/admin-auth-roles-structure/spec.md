## Purpose

Document the current authentication surface and define the planned role, registration, provider, creator workspace, and sensitive admin-control model before role-gated implementation.
## Requirements
### Requirement: Current auth inventory

The system SHALL document the current registration and authentication surface before role-gated admin behavior is implemented.

#### Scenario: Current auth providers are documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify that email/password, Google, and GitHub auth are configured through better-auth

#### Scenario: Current auth routes are documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify the sign-in, sign-up, and better-auth API routes used by the application

#### Scenario: Current user storage is documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify that users are stored in the project PostgreSQL database through the better-auth Prisma adapter
- **AND** it SHALL identify the Prisma `User`, `Session`, `Account`, and `Verification` auth models as the current auth storage surface

#### Scenario: Current admin boundary is documented

- **WHEN** the admin auth and roles structure is reviewed
- **THEN** it SHALL identify that `/admin` is currently protected by session presence rather than a role check

### Requirement: Role model planning

The system SHALL define the first role model before implementing role-gated admin access.

#### Scenario: Prisma User is role source of truth

- **WHEN** the role model is planned
- **THEN** the plan SHALL use the existing Prisma `User` model as the persisted source of truth for first-party roles
- **AND** it SHALL NOT rely on OAuth provider metadata as the authorization source of truth

#### Scenario: Better-auth role conventions are evaluated

- **WHEN** the role storage implementation is planned
- **THEN** the plan SHALL evaluate better-auth Admin plugin adoption before adding custom role infrastructure
- **AND** it SHALL prefer better-auth-compatible role storage conventions when they fit the project role model

#### Scenario: Better-auth Admin plugin is deferred to implementation slice

- **WHEN** the planning feature defines role storage direction
- **THEN** it SHALL NOT require Better Auth Admin plugin installation in this planning slice
- **AND** it SHALL identify a follow-up role-storage implementation slice for plugin adoption, schema changes, safe defaults, manual first-admin promotion, and minimal server-side role helpers

#### Scenario: Minimal role vocabulary is defined

- **WHEN** the role model is planned
- **THEN** it SHALL define a minimal vocabulary for administrators and ordinary authenticated users
- **AND** ordinary authenticated users SHALL retain access to creator-owned workspace features

#### Scenario: Editor role is deferred

- **WHEN** the role model is planned
- **THEN** it SHALL identify `editor` as a future content-moderation role
- **AND** it SHALL NOT require `editor` to be implemented in the first role-storage slice

#### Scenario: Editor avoids system controls

- **WHEN** the future `editor` role is planned
- **THEN** it SHALL grant cross-user content capabilities without granting role management, global settings, backups, storage limits, or auth administration

#### Scenario: Existing users receive safe defaults

- **WHEN** a future role implementation adds persisted roles
- **THEN** the plan SHALL define how existing users receive a safe default role

#### Scenario: First admin is assigned manually

- **WHEN** the first role implementation is rolled out
- **THEN** all users SHALL default to the ordinary user role
- **AND** the first administrator SHALL be promoted manually through Prisma Studio or SQL
- **AND** the system SHALL NOT automatically promote the first registered user

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

#### Scenario: Public registration remains open

- **WHEN** roles are introduced
- **THEN** public registration SHALL remain available
- **AND** newly registered users SHALL receive the ordinary user role by default

#### Scenario: Incomplete auth flows are identified

- **WHEN** the registration and auth surface is reviewed
- **THEN** the plan SHALL identify whether email verification, password reset, account settings, invite flow, and provider account linking are included or deferred

#### Scenario: Email verification is non-gating at first

- **WHEN** mailbox-backed email verification is added in a follow-up feature
- **THEN** the first version SHALL NOT block ordinary authenticated workspace access solely because the email is unverified
- **AND** it SHALL NOT require verified email before administrator access until a later decision changes that policy

#### Scenario: Email password flow is split out

- **WHEN** concrete account-flow follow-ups are planned
- **THEN** the plan SHALL identify a separate email/password feature for form-based account creation, login, mailbox-backed email verification, and password reset boundaries

#### Scenario: GitHub account flow is split out

- **WHEN** concrete account-flow follow-ups are planned
- **THEN** the plan SHALL identify a separate GitHub feature for social account creation, login, callback behavior, email availability, and account-linking boundaries

#### Scenario: Google remains enabled

- **WHEN** provider support is planned
- **THEN** Google sign-in SHALL remain part of the supported authentication surface unless a later provider-cleanup feature changes that decision

#### Scenario: Account management is deferred

- **WHEN** the near-term auth roadmap is planned
- **THEN** dedicated account management UX SHALL be deferred until a later feature

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

### Requirement: Role storage implementation follow-up

The system SHALL implement the accepted role-storage planning follow-up as a separate role foundation before sensitive admin features depend on roles.

#### Scenario: Role storage follow-up is implemented

- **WHEN** the accepted auth and roles structure calls for role-storage implementation
- **THEN** `feature-017-auth-admin-plugin-role-storage` SHALL provide the first persisted role foundation
- **AND** it SHALL use Better Auth Admin plugin conventions unless implementation validation proves them unsuitable

#### Scenario: Sensitive features can depend on role storage

- **WHEN** future features add UploadThing site settings, all-user file dashboards, database backups, role management, or moderation of other users' content
- **THEN** those features SHALL be able to depend on the persisted `admin` role foundation from this slice
