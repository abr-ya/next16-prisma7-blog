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

### Requirement: Manual full backup trigger on the admin database page

The system SHALL expose a `Generate full backup` control on the existing admin-only `/admin/database` page that an authenticated administrator can press to start a streaming full-scope database backup download.

#### Scenario: Admin opens the page

- **WHEN** an administrator navigates to `/admin/database`
- **THEN** they see the existing structure overview (scopes, metadata fields, boundaries) followed by a `Generate full backup` panel with a primary action labeled `Generate full backup` and a one-line description of the artifact format and contents

#### Scenario: Anonymous viewer is denied

- **WHEN** an unauthenticated visitor opens `/admin/database`
- **THEN** the page returns the same response the existing admin layout returns for unauthenticated viewers (redirect to sign-in) and no backup controls are reachable

#### Scenario: Authenticated non-admin user is denied

- **WHEN** an authenticated user without the persisted `admin` role opens `/admin/database`
- **THEN** the page returns the same denial the existing admin layout returns for non-admin authenticated users and no backup controls are reachable

#### Scenario: Runtime preflight disables the control

- **WHEN** the server cannot locate a working `pg_dump` executable at request time
- **THEN** the `Generate full backup` control is rendered disabled and the panel shows a localized reason explaining that the runtime is missing `pg_dump`, with a hint about which environment variable (`BACKUP_PG_DUMP_BIN`) controls the binary path
- **AND** the disabled control SHALL NOT expose a download URL or accept a click

### Requirement: Full backup download route

The system SHALL provide an admin-only streaming download route that produces the full backup archive when invoked.

#### Scenario: Authorized admin triggers a download

- **WHEN** an administrator submits `GET /api/admin/database-backups/full`
- **THEN** the route returns HTTP 200 with `Content-Type: application/gzip`, `Content-Disposition: attachment; filename="<environment>-<UTC-timestamp>.tar.gz"`, and a streamed body containing exactly the archive contents defined in `Full backup archive format`

#### Scenario: Unauthenticated request is denied

- **WHEN** an unauthenticated client requests the download route
- **THEN** the route returns HTTP 401/403 and produces no backup body, no log entry, and no manifest generation

#### Scenario: Authenticated non-admin request is denied

- **WHEN** an authenticated user without the persisted `admin` role requests the download route
- **THEN** the route returns HTTP 403 and produces no backup body; a single audit `Log` row records the denial with the requester identity, requested scope, and outcome

#### Scenario: Missing pg_dump preflight on the route

- **WHEN** the route is invoked but `pg_dump` cannot be located at runtime
- **THEN** the route returns HTTP 503 with a localized message body, no archive is streamed, and a single failure `Log` row is written

### Requirement: Full backup archive format

The system SHALL produce a downloadable archive of `tar.gz` containing exactly three files at the archive root: `dump.sql`, `manifest.json`, `README.txt`. No other files are added; no upload to external storage happens.

#### Scenario: dump.sql content contract

- **WHEN** the archive is generated for a `full` scope request
- **THEN** `dump.sql` SHALL contain the full public schema of the project database as plain `CREATE TABLE` / `INSERT` / `ALTER` / `CREATE INDEX` / etc. statements suitable for restore by `psql` against an empty target schema
- **AND** the dump SHALL NOT include owner / role statements (`--no-owner`) and SHALL NOT include `ACL GRANT` statements

#### Scenario: manifest.json content contract

- **WHEN** the archive is generated for a `full` scope request
- **THEN** `manifest.json` SHALL be a JSON object that contains, at minimum, the seven fields documented in the structure spec: `generatedAt` (UTC ISO 8601 with `Z`), `environment` (the same label surfaced in the download filename and derived from runtime config), `scope` (always the literal string `"full"` in this slice), `includedDomainsOrTables` (an array listing each Prisma model group included by the dump), `formatVersion` (the literal string `"1"`), `generatorSource` (an identifier referencing this project's name, version, and a URL or path to the generator), and `restoreCompatibilityNotes` (a short plain-text note describing restore prerequisites, including that the dump is a `pg_dump` plain-text dump and is intended for `psql` restore into an empty schema)

#### Scenario: README.txt content contract

- **WHEN** the archive is generated for a `full` scope request
- **THEN** `README.txt` SHALL include a one-paragraph restore note explaining how to extract and apply `dump.sql`, a reminder that UploadThing file bytes are not included, and a pointer to the manifest field `restoreCompatibilityNotes` for the full restore note set
- **AND** it SHALL NOT include any instructions for retention, scheduling, encryption, or external object storage

#### Scenario: Archive is not persisted

- **WHEN** the archive download completes (success or failure)
- **THEN** the system SHALL NOT write the archive contents to project-managed storage, SHALL NOT create a `FileAsset` row for it, SHALL NOT create any new persisted backup-record table row, and SHALL stream the bytes once to the requesting browser

### Requirement: Generation audit via Log

The system SHALL record backup generation and download events through the existing `Log` model with no new schema or migration in this slice.

#### Scenario: Successful generation is logged

- **WHEN** an administrator successfully triggers a full backup download
- **THEN** a `Log` row is written with `action = "database.backup.generate"`, `userId` equal to the administrator's `User.id`, a `createdAt` timestamp at or before the moment the archive stream starts, and `details` containing the same scope, environment, and `manifest.json` summary fields documented in `Full backup archive format`

#### Scenario: Successful download is logged

- **WHEN** the download stream begins streaming bytes to the requesting administrator
- **THEN** a second `Log` row is written with `action = "database.backup.download"`, `userId` equal to the administrator's `User.id`, and `details` containing the stream start time, scope, environment, and the byte size of the archive as it streams
- **AND** the row is written at most once per download attempt; partial / interrupted streams are still logged as a single download event with the partial size in `details`

#### Scenario: Failed generation is logged

- **WHEN** generation fails before the archive stream begins (for example `pg_dump` is missing or returns non-zero, `manifest.json` serialization fails, or a precondition check rejects the request)
- **THEN** a `Log` row is written with `action = "database.backup.generate"`, `userId` equal to the requesting administrator's `User.id`, and `details` describing the failure reason so audit-only consumers can diagnose without server log access

### Requirement: Reuse the existing structure contract

The system SHALL keep all requirements previously published in the structure slice in force and SHALL extend — never replace — them with this slice.

#### Scenario: Structure spec continues to govern

- **WHEN** this slice is implemented and archived
- **THEN** the existing structure requirements (`Admin-only backup surface`, `Backup scopes`, `Backup artifact metadata and formats`, `Backup audit boundaries`, `Restore boundaries`, `Implementation follow-up boundaries`) remain in the active capability spec and govern every behavior this slice introduces (admin role gate, scope declaration, manifest content, audit, restore deferral, follow-up boundaries)

#### Scenario: Partial scope stays as contract only

- **WHEN** an administrator inspects the page in this slice
- **THEN** the page shows only a `Generate full backup` control; partial-scope controls remain documented in the structure overview but are not actionable until a separate future capability slice ships partial generation
