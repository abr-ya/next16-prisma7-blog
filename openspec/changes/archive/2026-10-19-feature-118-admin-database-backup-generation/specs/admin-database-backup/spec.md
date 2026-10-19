# Spec Delta

## Purpose

<!-- This is a delta for an existing capability; the established Purpose stays in the main spec. -->

## ADDED Requirements

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
