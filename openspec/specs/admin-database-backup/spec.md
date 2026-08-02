# admin-database-backup Specification

## Purpose

Define the admin-only database backup surface, backup scope contract, artifact metadata, audit boundaries, and restore limits before executable backup and restore features are implemented.

## Requirements
### Requirement: Admin-only backup surface

The system SHALL define database backup controls as sensitive administrator-only functionality.

#### Scenario: Backup route is role gated

- **WHEN** a future database backup page, route handler, or server action is implemented
- **THEN** it SHALL require the persisted `admin` role through server-side authorization
- **AND** it SHALL NOT rely only on the authenticated `/admin` layout boundary

#### Scenario: Ordinary creator users are excluded

- **WHEN** an authenticated user without the `admin` role attempts to access backup functionality
- **THEN** the system SHALL deny access before exposing backup metadata, generation controls, or downloadable artifacts

#### Scenario: Public surface is absent

- **WHEN** database backup functionality is implemented
- **THEN** public routes SHALL NOT expose backup controls, backup manifests, generated backup files, or restore controls

#### Scenario: Structure page is admin-only

- **WHEN** the first database backup structure page is implemented
- **THEN** it SHALL render only after server-side `admin` role authorization succeeds
- **AND** it SHALL describe planned backup scopes, metadata, audit, and restore boundaries without generating backup artifacts

### Requirement: Backup scopes

The system SHALL define full and partial database backup scopes before backup generation is implemented.

#### Scenario: Full backup scope is explicit

- **WHEN** the system offers a full database backup
- **THEN** the backup contract SHALL identify it as covering project PostgreSQL data needed to reconstruct application state
- **AND** it SHALL explicitly account for auth records, content records, comments, links, videos, tags, file metadata, and operational logs

#### Scenario: Partial backup scope is explicit

- **WHEN** the system offers a partial database backup
- **THEN** the backup contract SHALL require the selected domains or tables to be declared in backup metadata
- **AND** it SHALL require omitted domains or tables to be distinguishable from included data

#### Scenario: Provider file bytes are excluded

- **WHEN** a database backup includes first-party file records or content references
- **THEN** the backup contract SHALL treat provider-stored file bytes as outside the database backup
- **AND** it SHALL require backup metadata or UI to distinguish stored file metadata from external object storage

### Requirement: Backup artifact metadata and formats

The system SHALL define portable backup artifact expectations before exporting data.

#### Scenario: Backup manifest is required

- **WHEN** a future implementation creates a backup artifact
- **THEN** the artifact SHALL include or be accompanied by metadata for generation time, environment label, scope, included domains or tables, format version, generator source, and restore compatibility notes

#### Scenario: Full backups use restore-capable formats

- **WHEN** a future implementation creates a full database backup
- **THEN** the selected format SHALL preserve relational database state well enough for a future restore design to evaluate it
- **AND** JSON or CSV exports SHALL NOT be considered full restore artifacts unless a later restore design explicitly supports them

#### Scenario: Partial exports disclose restore limits

- **WHEN** a future implementation creates a partial export
- **THEN** the backup metadata SHALL identify whether the artifact is informational, content-importable, or restore-capable

### Requirement: Backup audit boundaries

The system SHALL define audit expectations for database backup operations.

#### Scenario: Backup generation is auditable

- **WHEN** an administrator generates a backup
- **THEN** the system SHALL record or otherwise preserve an auditable event containing the administrator identity, action time, backup scope, and result

#### Scenario: Backup download is auditable

- **WHEN** an administrator downloads or accesses a stored backup artifact
- **THEN** the system SHALL record or otherwise preserve an auditable event containing the administrator identity, action time, artifact identity, and result

#### Scenario: Audit schema is deferred

- **WHEN** the structure slice is accepted
- **THEN** it SHALL NOT require a new persisted audit model until a follow-up implementation slice decides whether existing logs are sufficient

### Requirement: Restore boundaries

The system SHALL treat database restore as a separate high-risk capability.

#### Scenario: Restore is not part of structure slice

- **WHEN** this backup structure feature is implemented or archived
- **THEN** the system SHALL NOT add live restore, import, overwrite, reset, or destructive database behavior

#### Scenario: Future restore requires preflight

- **WHEN** a later feature proposes database restore behavior
- **THEN** it SHALL require a restore design with preflight validation, explicit administrator confirmation, environment restrictions, and rollback or recovery expectations

#### Scenario: Restore compatibility is declared

- **WHEN** a backup artifact is generated
- **THEN** the backup metadata SHALL declare restore compatibility status instead of implying that every export can be restored

### Requirement: Implementation follow-up boundaries

The system SHALL split database backup work into small implementation slices after the structure is accepted.

#### Scenario: First slice can publish a structure page

- **WHEN** this structure slice is implemented
- **THEN** it MAY add an admin-only informational database backup page that documents the contract before executable backup operations exist

#### Scenario: First implementation can generate backups manually

- **WHEN** a follow-up backup implementation starts
- **THEN** it MAY focus on a manual admin-triggered backup generation flow before scheduling, retention, restore, or external provider integration

#### Scenario: Retention is separate

- **WHEN** backup retention, cleanup, or expiration is implemented
- **THEN** it SHALL be handled as an explicit follow-up behavior with its own access and data-preservation rules

#### Scenario: External storage is separate

- **WHEN** backup artifacts need object storage, encryption policy, or provider-specific lifecycle behavior
- **THEN** that storage policy SHALL be defined in a follow-up implementation or settings feature
