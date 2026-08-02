## Context

The app is a personal blog/content hub backed by PostgreSQL through Prisma 7. Current data includes Better Auth tables (`User`, `Session`, `Account`, `Verification`), content tables (`Post`, `MdDoc`, `Category`, links, comments, videos, tags, bookmarks), file metadata (`FileAsset`), and operational logs (`Log`). Provider-stored file binaries are outside PostgreSQL and are represented only by metadata in the database.

The accepted auth role foundation provides persisted `user` and `admin` roles plus server-only helpers such as `requireAdmin()`. The accepted admin auth structure identifies database backups as sensitive admin-only operations. The broader `/admin` layout remains an authenticated creator workspace, so database backup controls need their own role-gated boundary.

This feature is a structure slice. It defines backup and restore contracts before follow-up implementation features create UI, server actions, generated files, retention jobs, or restore tooling.

## Goals / Non-Goals

**Goals:**

- Define the first admin-only database backup capability and its route boundary.
- Define full and partial backup scopes in project terms.
- Define backup artifact metadata, export formats, and data-safety expectations.
- Define audit requirements for backup-related decisions.
- Define restore boundaries so a future restore feature starts from an explicit risk model.
- Keep implementation slices small and ordered.

**Non-Goals:**

- No backup generation, backup download, scheduling, retention cleanup, or restore implementation in this slice.
- No Prisma schema or migration change in this slice unless a later approved implementation needs persisted audit/backup records.
- No database reset, rewrite, seed, import, or destructive operation.
- No backup access for ordinary authenticated creator users.
- No UploadThing binary export; database backups cover provider metadata, not provider object storage.
- No external backup provider integration.

## Decisions

### Decision: Use an admin-only database surface

Future backup UI should live under `/admin/database` or a similarly explicit admin database route, but the route/page/action boundary must call `requireAdmin()` or an equivalent server-only role helper. It must not rely on the `/admin` layout's session-only creator workspace gate.

Alternative considered: put backup controls on the existing admin dashboard. That would make a sensitive system operation too easy to mix with ordinary content work.

### Decision: Separate structure from execution

This feature should define the capability only. Follow-up slices should implement backup generation, persisted backup records, file download/storage, retention, and restore workflows after the contract is accepted.

Alternative considered: implement a simple `pg_dump` action immediately. That skips export-scope, retention, audit, and restore-safety decisions and is too risky for a first database-backup slice.

### Decision: Define two backup scopes

The planned backup model should support:

- Full database backup: all project PostgreSQL data required to reconstruct app state, including auth rows, content, comments, file metadata, and logs when selected.
- Partial backup: a deliberately limited export by domain, such as content-only or selected operational tables, with clear metadata describing what was included and omitted.

Alternative considered: only support full backups. Full-only is simpler, but it does not cover likely admin needs such as exporting content separately from auth/session data.

### Decision: Treat provider files separately

Database backups should include `FileAsset` rows and content references, but not UploadThing object bytes. A later file-storage backup feature can define provider-object export or reconciliation.

Alternative considered: bundle provider files into database backups. That couples database export to storage-provider behavior and can produce unexpectedly huge, slow, or incomplete backup artifacts.

### Decision: Prefer safe, portable export artifacts

Follow-up implementation should prefer a plain SQL dump or a compressed archive containing SQL plus a manifest. The manifest should include generation time, app environment label, backup scope, included domains/tables, format version, tool/source, and restore compatibility notes. JSON/CSV exports may be useful for partial content exports, but they should not be treated as full restore artifacts unless a later restore design explicitly supports them.

Alternative considered: define only JSON exports. JSON is readable, but it is weaker for preserving relational constraints, indexes, auth data, and database-specific state.

### Decision: Audit before restore

Backup creation and download should be auditable. Restore should remain a separately approved feature because it can overwrite or corrupt live data. The first restore contract should require dry-run/preflight checks, explicit admin confirmation, and a non-production-first validation path.

Alternative considered: include restore in the first implementation. Restore is operationally dangerous and should not be bundled into backup structure or first backup-generation work.

## Risks / Trade-offs

- Backup files may contain secrets, private content, auth identifiers, or session data -> Require admin-only access, clear metadata, secure storage/download boundaries, and no public URLs.
- Ordinary creator users can access `/admin` today -> Gate backup routes/actions with `requireAdmin()` rather than the admin layout alone.
- Provider files can be mistaken as included -> Manifest and UI copy must distinguish database records from external object bytes.
- Partial backups can be mistaken as restorable -> Require each partial export to declare included and omitted domains and whether it is restorable.
- Restore can destroy current data -> Keep restore implementation out of scope and require a future design with dry-run and rollback expectations.
- Audit storage may require schema changes -> Defer persisted audit/backup-record schema until the implementation slice, or reuse existing `Log` only if it fits without weakening audit quality.

## Migration Plan

1. Accept this structure as an OpenSpec capability.
2. Implement a follow-up backup-generation slice that creates the admin-only route/page/action boundary and generates a manual backup artifact.
3. Add persisted backup/audit records only in an approved implementation slice if file listing, download history, or retention requires them.
4. Add restore only after a separate restore design defines preflight checks, confirmation, environment limits, and rollback expectations.

Rollback for this structure slice is documentation-only: archive is reversible through a follow-up spec change. No database or runtime rollback is expected.

## Open Questions

- Should the first implementation store generated backups as first-party `FileAsset` records, stream them directly, or write them outside app-managed storage?
- Should auth/session tables be included by default in full backups, or should full backups require an explicit sensitive-data confirmation?
- Should operational `Log` rows be included by default or treated as an optional domain because they can be noisy?
- Which retention policy should be the first implementation default: manual-only deletion, capped count, or age-based cleanup?
