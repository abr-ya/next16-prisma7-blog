# Design

## Context

The accepted [feature-020-admin-database-backup-structure](../../../changes/archive/2026-08-02-feature-020-admin-database-backup-structure/proposal.md) page at [`app/admin/database/page.tsx`](../../../../app/admin/database/page.tsx) renders an informational overview sourced from [`lib/admin-database-backup-contract.ts`](../../../../lib/admin-database-backup-contract.ts). The page has `requireAdmin()` and a `Structure only` badge, but offers no executable controls. `pg_dump` is available at `/usr/bin/pg_dump` in the runtime. The project database is Neon Postgres, with `DATABASE_URL` pointing at the pooler at `*.c-2.eu-central-1.aws.neon.tech/neondb` and `sslmode=require&channel_binding=require`. The existing [`Log`](../../../../prisma/schema.prisma) model stores `action: String` and `userId: String`; `createLogEvent` in [`app/_data/log.ts`](../../../../app/_data/log.ts) writes a log row for the current session user with `action: LogAction | string`, so new audit actions can be added without a schema migration.

See [proposal.md](proposal.md) for motivation.

## Goals / Non-Goals

**Goals:**

- Produce a single tar.gz containing `dump.sql`, `manifest.json`, `README.txt` on demand
- Stream the archive once to the requesting administrator's browser
- Fail closed: missing `pg_dump`/admin role/non-admin user → no archive bytes and an audit row
- Add zero schema changes, zero new dependencies, zero persisted backup records
- Update [`app/admin/database/page.tsx`](../../../../app/admin/database/page.tsx) in place with a clearly-labeled `Generate full backup` panel

**Non-Goals:**

- No partial-scope generation (contract only, per spec)
- No restore / preflight / destructive DB behavior
- No retention, no scheduled jobs, no on-server backup storage, no UploadThing round trip
- No new Prisma migration or audit table
- No new npm dependency
- No environment label flag UI; environment is derived from runtime env

## Decisions

### Decision: Route-only download, no separate server action

The trigger on `/admin/database` is a plain `<a>` link to the download route `GET /api/admin/database-backups/full`. The route handler validates admin role, performs preflight, writes audit log, then streams the archive. There is no separate `generateDatabaseBackup()` server action because adding one would duplicate the admin gate and the audit log without producing observable behavior the route can't already produce.

- Alternative considered: server action that returns a signed download URL. Adds two request steps (action POST, then browser fetch of URL) and requires the signed URL to carry the same admin authorization — extra storage for a manual-only flow.
- Alternative considered: route only with no UI element. Admin would have to type the URL by hand. The page panel exists to keep the URL discoverable and the contract obvious.

### Decision: Single tar.gz archive produced by spawning `pg_dump` and `tar` CLI

The route handler runs a short shell pipeline on the Node runtime: prepare a tmp directory, run `pg_dump` to write `dump.sql`, build `manifest.json` and `README.txt` in memory and write them, then run `tar czf - ...` and pipe stdout into the HTTP response. The tmp directory is cleaned in `finally`. Stdout chunks are flushed straight into the `Response` body as they arrive.

- Alternative considered: in-process `zlib.createGzip()` + manual tar framing. Avoids spawning `tar`, but requires us to write a small tar emitter that handles file boundaries, PAX extended headers, and file modes — more code, more surface area, no real win.
- Alternative considered: add `tar` npm package. Rejected — new dep, and `tar` CLI is shipped on every Linux/macOS image Next.js runs on.
- Alternative considered: write the tar.gz to a tmp file first, then read it back. Simpler streaming code at the cost of disk I/O for a multi-MB payload. Streaming-through-shell is preferred because it minimizes peak disk usage and avoids a second disk pass.

### Decision: `pg_dump --no-owner --no-acl --clean --if-exists --schema=public` as the dump command

The dump contract is the minimum needed to round-trip the public schema, while excluding role/ACL statements that would force restores into a same-named role environment:

```
pg_dump \
  --no-owner --no-acl --clean --if-exists --quote-all-identifiers \
  --schema=public --dbname="$DATABASE_URL"
```

This produces plain `CREATE TABLE` / `INSERT` / `ALTER TABLE` / `CREATE INDEX` statements against an empty target schema. The `--no-owner --no-acl` flags match the spec scenario "dump.sql content contract".

- Alternative considered: include owner/ACL statements. Would tie restores to the original role names and break portability, which the structure spec explicitly rejects.
- Alternative considered: dump individual tables one-by-one to provide a partial-scope path. Out of scope for this slice.

### Decision: pg_dump binary resolution via `BACKUP_PG_DUMP_BIN` env with `$PATH` fallback

A helper `resolvePgDumpBin()` checks `process.env.BACKUP_PG_DUMP_BIN` first; if unset, it uses `which pg_dump` (Node's `child_process.execFileSync`) to resolve from `$PATH`. If neither returns a path, the page renders the `Generate full backup` control as disabled and the route returns HTTP 503. No new env is required — this is opt-in for custom locations.

- Alternative considered: bundle `pg_dump` via a dev dependency. Rejected for size and supply-chain reasons; most runtimes already have a working Postgres client.

### Decision: Environment label derives from runtime env

The environment label in the manifest and the filename prefix is computed by:

```
const environment = process.env.BACKUP_ENVIRONMENT_LABEL
  ?? process.env.VERCEL_ENV
  ?? process.env.NODE_ENV
  ?? "development";
```

The download filename is `${environment}-${ISO-timestamp-with-Z}.tar.gz`. The manifest's `environment` field carries the same value.

- Alternative considered: read a project setting from the database. The structure spec calls for an environment label, but adding a setting model or table for one label is overkill at this scope. Future backup settings feature can introduce a table.

### Decision: Reuse existing `Log` model with string-typed action values

Audit rows use the existing `Log` model — no migration. `action` values are the strings `"database.backup.generate"` (success/failure) and `"database.backup.download"` (start/finish/interrupted). `details` carries a compact JSON blob: `{ scope, environment, formatVersion, byteSize?, failureReason? }`.

The `"use server"` [`createLogEvent`](../../../../app/_data/log.ts) helper already enforces the `userId` link to the current session and accepts a `string` action — no schema change to `LogAction` needed.

- Alternative considered: extend `LogAction` enum. Type-only change with no runtime effect; future slice can add it during the audit/settings follow-up if a typed surface is wanted.

### Decision: UI rendering is server-only on the existing admin page

[`app/admin/database/page.tsx`](../../../../app/admin/database/page.tsx) extends with a new `<DatabaseBackupPanel>` server component that renders the description, a `<form method="get" action="/api/admin/database-backups/full">` whose submit button is the trigger, and the preflight state. No client component is needed; the form submits via plain navigation. A small helper detects `pg_dump` availability at request time and disables the button with a localized reason when missing.

- Alternative considered: client island with a download trigger. Adds interactivity that the spec doesn't need.

### Decision: Audit row written before stream start, log details updated after stream completes

The route writes the `database.backup.generate` log row first (success-only happens at that point), then streams the archive, then writes (or updates) a `database.backup.download` log row with the actual byte count. Failure paths write a single failure `Log` row and return early. This guarantees an audit trail even when the connection drops mid-stream.

- Alternative considered: write the row after success. Drops the trail when streams fail; download audit must outlive the stream.

## Risks / Trade-offs

- **`DATABASE_URL` targets the Neon pooler** → `pg_dump` may emit snapshot-inconsistency warnings or fail with long-running statements if Neon throttles the pooler. Mitigation: if pooler-induced failures appear in production, document a follow-up setting `BACKUP_DATABASE_URL` for the direct (non-pooled) Neon endpoint and prefer it via the new env var. This slice uses `DATABASE_URL` and surfaces the failure mode through the same `Log` row.
- **Sensitive auth rows included by default** → the dump contains `User`, `Session`, `Account`, `Verification` rows. Mitigation: the page description and `README.txt` explicitly call out that auth data is included and that the recipient is responsible for the downloaded archive; only admins can run the flow; `Log` rows record who downloaded what.
- **Spawning `pg_dump` on the server requires a working Postgres client in the runtime image** → the page button is rendered disabled with a localized reason when preflight fails, the route returns 503, and `npm run build` does not depend on `pg_dump`. No production impact where the image already has `pg_dump` (verified locally).
- **Streaming tar.gz means the response `Content-Length` is unknown up front** → browsers still receive the download because `Content-Disposition: attachment` triggers a save dialog before bytes finish. No special handling required; if this ever breaks, set `Transfer-Encoding: chunked` explicitly.
- **`pg_dump` injection via `DATABASE_URL`** → the URL is read from process env only and passed unparsed to `pg_dump --dbname`. Mitigation: env vars are operator-controlled; never interpolate user input into the command.
- **Backup archive contents may be reused, not deleted, after a successful run** → the archive lives in `/tmp` for the lifetime of the request and is removed in `finally`. If the Node process crashes between write and cleanup, the tmp dir will accumulate; a system-level cron is out of scope (a separate retention/external-storage feature handles long-term cleanup).

## Migration Plan

1. Ship this slice as one PR per [tasks.md](tasks.md).
2. No database migration. No environment migration. No new variables required (existing `DATABASE_URL` and `NODE_ENV` are sufficient).
3. Rollback: revert the PR. No data states need cleanup because no persisted backup records exist.

## Open Questions

- Whether `DATABASE_URL` (Neon pooler) tolerates `pg_dump` long-statement behavior in production, or whether we want `BACKUP_DATABASE_URL` from the start for the direct Neon endpoint. Can ship without; add the env in a future slice only if a real production failure appears.
- Exact `includedDomainsOrTables` array content for the manifest — first slice uses the Prisma model group naming already documented in the structure spec (`auth`, `content`, `comments`, `links`, `videos`, `tags`, `fileMetadata`, `logs`). A future restore-compatibility feature may extend or partition this list.
