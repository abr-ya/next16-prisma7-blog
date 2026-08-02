## Why

Administrators need a planned database-backup surface before the app exposes any controls for exporting or restoring project data. Now that persisted `admin` role storage exists, the next safe step is to define the backup contract, access boundary, export scope, audit expectations, and restore limits before implementation slices create operational controls.

## What Changes

- Define an admin-only database backup structure for `/admin/database` or a similarly scoped admin database surface.
- Specify full and partial backup scopes at the contract level, including which project-owned data is eligible for export.
- Define safe export formats and metadata expectations for generated backup files.
- Require role-gated access using the existing persisted `admin` role helpers rather than the broader authenticated `/admin` creator workspace boundary.
- Define audit expectations for backup creation, download, and restore-related decisions.
- Define restore boundaries, including which restore operations are explicitly deferred until a later implementation feature.
- Identify follow-up implementation slices for backup generation, backup listing/download, retention, and restore workflows.

### Non-goals

- Do not implement backup generation, download, scheduling, retention, or restore behavior in this structure slice.
- Do not add Prisma schema changes or migrations in this structure slice unless the planning uncovers an unavoidable audit/logging requirement that must be separately approved.
- Do not reset, rewrite, seed, or otherwise mutate database contents.
- Do not expose backup controls to ordinary authenticated users.
- Do not introduce provider-specific storage or external backup-service integration in this slice.
- Do not include UploadThing provider binaries in database backups; file backup policy remains a separate storage concern.

## Capabilities

### New Capabilities

- `admin-database-backup`: Defines role-gated admin database backup planning, export scopes, backup metadata, audit boundaries, and restore limits.

### Modified Capabilities

None.

## Impact

- Affected route surface: future admin-only database/backup page under `/admin`.
- Affected auth surface: backup operations must use the persisted `admin` role, not only authenticated-session access.
- Affected data: project PostgreSQL data managed through Prisma, with explicit treatment for auth tables, content tables, analytics/log tables, file metadata, and provider-stored files.
- Affected docs/specs: OpenSpec planning artifacts and accepted specs after archive.
- No public routes, schema migrations, new dependencies, or generated Prisma files are expected in this structure slice.
