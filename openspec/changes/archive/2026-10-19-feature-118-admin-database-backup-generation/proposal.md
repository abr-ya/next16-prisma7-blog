# Proposal

## Why

The accepted [feature-020-admin-database-backup-structure](../../changes/archive/2026-08-02-feature-020-admin-database-backup-structure/proposal.md) page documents the backup contract at `/admin/database` but exposes no executable controls — today admins have no first-party way to generate a PostgreSQL backup from the running app. Without manual generation, the documented contract is informational only; the next safe step is a small implementation slice that turns the existing `Full database` scope into a working, auditable download.

## What Changes

- Add an admin-triggered **full** backup action that produces a single downloadable archive: `dump.sql` (plain PostgreSQL dump via `pg_dump`, `--schema=public --no-owner`, statement-level restore) plus `manifest.json` (metadata fields per structure spec) and `README.txt` (restore notes), bundled as `tar.gz`. Streaming download — no persistent backup records, no `FileAsset` rows, no on-disk storage, no UploadThing round trip.
- Add a new admin action `generateDatabaseBackup()` plus a download route at `app/api/admin/database-backups/full/route.ts` that streams the archive. Both call `requireAdmin()` directly (not the `/admin` layout gate) and write an audit row through the existing `Log` model — schema unchanged.
- Add a `Generate full backup` panel to `/admin/database` between the existing *Structure* section and the boundaries card. It renders only when the runtime exposes a `pg_dump` executable path; otherwise it surfaces a clear disabled-with-reason state.
- The structure page's status copy updates from `Structure only` → `Structure + full backup generation` to reflect the addition. Scope/manifest/boundary sections stay informational; nothing about partial scope, retention, scheduling, restore, or external storage becomes active.
- Persisted audit/backup-record tables remain deferred. Audit coverage comes from existing `Log` rows with `action = "database.backup.generate"` (success/failure) and `"database.backup.download"` (success); failure messages are stored in `details`.

**Non-goals**

- No `partial` scope support in this slice (per structure spec the contract still defines it; first execution only ships *full*).
- No restore, dry-run preflight, restore validation, or destructive DB behavior.
- No retention/cleanup/expiry, no scheduled jobs, no on-server backup file storage, no `FileAsset` rows for backups.
- No UploadThing / S3 / external object-storage integration; the artifact is streamed once and discarded.
- No environment label flag UI; environment is read from `process.env.NODE_ENV` and reflected in the manifest.
- No schema migrations or new audit model; reused `Log` model is enough at this scope.
- No public surface changes, no new dependencies in `package.json`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-database-backup` — extend the accepted structure capability with new requirements for the manual generation + download surface (admin role on the route/action, streaming download format, runtime preflight for `pg_dump`, manifest content, audit via `Log`, no persistence in this slice). Existing six structure requirements stay in force; this slice **adds** delta requirements, never replaces them.

## Impact

- **Routes** — one new download route `GET /api/admin/database-backups/full` (admin role + `Log` write); no other route additions.
- **Server actions** — one new server-action-shaped handler `generateDatabaseBackup()` invoked from the page. Lives next to the existing structure page; created under `app/admin/database/` or `app/_actions/admin-database-backup.ts` per design-time choice.
- **Data** — no Prisma schema changes. Read-only access to `User`, `Session`, `Account`, `Verification`, `MdDoc`, `Post`, `PostImage`, `Category`, `Video`, `VideoChannel`, `VideoTag`, `VideoBookmark`, `Comment`, `Link`, `FileAsset`, `Log`, plus any other Prisma-managed tables that must be part of the dump. Writes limited to new `Log` rows.
- **Auth** — `requireAdmin()` is the only authorization boundary; the `/admin` layout session gate is not relied on for the download route.
- **Configuration** — needs a way to locate `pg_dump` at runtime (default `pg_dump` on `$PATH`, or explicit `BACKUP_PG_DUMP_BIN` env var later). First slice falls back to PATH resolution only.
- **Sidebar/admin nav** — `/admin/database` already exists at `app/admin/database/page.tsx`. The page is updated in place; new admin nav entries are not added.
- **Docs/checklists** — none expected. Project-evaluation/weekly-update docs may mention the milestone once shipped.
