## ADDED Requirements

### Requirement: Role storage implementation follow-up

The system SHALL implement the accepted role-storage planning follow-up as a separate role foundation before sensitive admin features depend on roles.

#### Scenario: Role storage follow-up is implemented

- **WHEN** the accepted auth and roles structure calls for role-storage implementation
- **THEN** `feature-017-auth-admin-plugin-role-storage` SHALL provide the first persisted role foundation
- **AND** it SHALL use Better Auth Admin plugin conventions unless implementation validation proves them unsuitable

#### Scenario: Sensitive features can depend on role storage

- **WHEN** future features add UploadThing site settings, all-user file dashboards, database backups, role management, or moderation of other users' content
- **THEN** those features SHALL be able to depend on the persisted `admin` role foundation from this slice
