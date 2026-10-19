# Tasks

## 1. Setup

- [x] 1.1 Create `lib/admin-database-backup.ts` with a typed `buildBackupArchive()` entry point that returns `{ archiveStream, filename, byteSize }` and a `resolvePgDumpBin()` helper. Verify the file is importable in a dry-load script (no runtime call yet) and that `npm run tsc` exits with no type errors against the existing `Log`, `prisma`, and `child_process` symbols — the file must export only async functions that are not yet wired into the page or the route handler.

- [x] 1.2 Add a test-only `lib/admin-database-backup-fixtures.ts` (kept next to the implementation, not used in the runtime path) with a `manifest-sample.json` string and a `readme-sample.txt` string. Verify the strings are referenced by the future `buildManifest`/`buildReadme` tests and `npm run tsc` exits cleanly. **N/A — no test runner exists in this repository (see CLAUDE.md "No dedicated test suite exists currently."). Pure helpers `buildManifest` / `buildReadme` are exported from `lib/admin-database-backup.ts` and remain testable as soon as a harness appears; no fixture file was added because nothing in this slice consumes it.**

## 2. Core generation pipeline (`lib/admin-database-backup.ts`)

- [x] 2.1 Implement `resolvePgDumpBin()` returning the absolute path to `pg_dump` from `process.env.BACKUP_PG_DUMP_BIN` if set, otherwise via `which`-style execFile resolution from `$PATH`, otherwise `null`. Verify by running an ad-hoc Node script `node -e 'require("./lib/admin-database-backup")'` (or equivalent direct eval): when the env var is unset the helper resolves `/usr/bin/pg_dump` in this repository; when set to a fake path the helper returns the fake path.

- [x] 2.2 Implement `buildManifest({ scope, environment, byteCount })` returning the manifest object per the `manifest.json content contract` scenario in [`specs/admin-database-backup/spec.md`](specs/admin-database-backup/spec.md): `generatedAt` (UTC ISO 8601 with `Z`), `environment`, `scope: "full"`, `includedDomainsOrTables` (array of the eight Prisma-domain group names from the structure spec), `formatVersion: "1"`, `generatorSource` (string with project name from `package.json`, project version, and the literal `"pg_dump"` tool name), `restoreCompatibilityNotes` (short plain-text note). Verify by importing the function in a `tsx`/`node --experimental-strip-types` smoke script that calls it once and asserts all eight keys are present and `formatVersion === "1"`.

- [x] 2.3 Implement `buildReadme()` returning the README body per the `README.txt content contract` scenario: one-paragraph restore note (extract + `psql` apply into empty schema), reminder that UploadThing bytes are not included, pointer to the manifest field. Verify by string-matching the three required substrings in the body.

- [x] 2.4 Implement `runPgDump({ binPath, connectionString })` spawning `pg_dump --no-owner --no-acl --clean --if-exists --quote-all-identifiers --schema=public --dbname="$DATABASE_URL"` with stdout/stderr piped to a `tmpDir`. Verify by running a one-shot Node script that invokes it against `DATABASE_URL` from the local `.env`, asserts the exit code is 0, and confirms a non-empty `dump.sql` was written.

- [x] 2.5 Implement `streamBackupArchive({ connectionString, manifest, readme, res })` that creates a unique `os.tmpdir()/admin-database-backup-<uuid>/`, writes `dump.sql` (via `runPgDump`), `manifest.json` (stringified), `README.txt` (text), then spawns `tar -C <tmpDir> -czf - dump.sql manifest.json README.txt` piping stdout into `res.body`, and cleans the `tmpDir` in `finally`. Verify by running the function against a stub `res` that collects chunks to `tmp/out.tar.gz`, then running `tar tzf out.tar.gz` and asserting the file list is exactly `dump.sql manifest.json README.txt`, and confirming the tmp dir is gone afterward.

## 3. Download route (`app/api/admin/database-backups/full/route.ts`)

- [x] 3.1 Create the route handler with `export const runtime = "nodejs"` (mirror [`app/files/[fileId]/thumbnail/route.ts`](../../../../app/files/[fileId]/thumbnail/route.ts)) and an async `GET` that first calls `requireAdminControl()` from [`lib/auth-utils.ts`](../../../../lib/auth-utils.ts). Verify by running `npm run tsc` and confirming the file typechecks against the existing `requireAdminControl` signature.

- [x] 3.2 Add the runtime preflight at the top of the handler — if `resolvePgDumpBin()` returns `null`, write a single failure `Log` row via [`createLogEvent`](../../../../app/_data/log.ts) with `action: "database.backup.generate"` and `details: JSON.stringify({ scope: "full", environment, failureReason: "pg_dump_not_found" })`, then return `NextResponse.json({ error: "..." }, { status: 503 })`. Verify by writing a one-off Node test that monkey-patches the helper to return `null` and asserts the response status is 503 and no archive bytes are produced.

- [x] 3.3 Add the successful `Log` row write before the stream starts (action `"database.backup.generate"`, userId from session, details JSON containing scope/environment/formatVersion). Verify by manually logging in as admin in dev and confirming the log row appears in the `Log` table.

- [x] 3.4 Stream the archive by calling `streamBackupArchive` with a `Web ReadableStream` or `Readable` piped into a `Response` body, set `Content-Type: application/gzip`, `Content-Disposition: attachment; filename="${environment}-${ISO-timestamp}.tar.gz"`. Verify by issuing `curl -u admin:...` (or authenticated browser request) in dev and confirming `Content-Disposition`, `Content-Type`, and a non-empty body of valid tar.gz bytes via `tar tzf -`.

- [x] 3.5 On stream start write a `Log` row with `action: "database.backup.download"`, details `{ scope, environment, streamStartedAt, byteSize: null }`. After the stream resolves (success, error, or client disconnect), update that row's `details` with the actual byte count or `failureReason`. Verify via a one-off dev request and inspecting two consecutive `Log` rows in the DB (one per action) with matching `userId`.

- [x] 3.6 Wrap the route body in `try/catch` so any thrown error (for example a spawn error or missing `DATABASE_URL`) writes a single failure `Log` row with `action: "database.backup.generate"` and a useful `failureReason` and returns `NextResponse.json({ error: "..." }, { status: 500 })`. Verify by removing `DATABASE_URL` from `.env.local` for a test request and confirming the 500 response + failure log row.

## 4. UI (`app/admin/database/page.tsx` and the new panel)

- [x] 4.1 Create `components/admin-pages/database-backup-panel.tsx` as an async server component that calls `resolvePgDumpBin()` and renders either (a) a `Card` with the description and a `<form method="get" action="/api/admin/database-backups/full">` submit button, or (b) the same `Card` with the submit `Button` rendered disabled and a localized reason paragraph that mentions `BACKUP_PG_DUMP_BIN`. Reuse the existing `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, and `Separator` primitives from [`components/ui/`](../../../../components/ui). Verify by importing the component from a temporary route render and reading the markup in dev.

- [x] 4.2 Extend [`app/admin/database/page.tsx`](../../../../app/admin/database/page.tsx) to render the new `<DatabaseBackupPanel>` after the existing `Scopes` overview and before the `Boundaries` overview. Update the page header from `<Badge variant="secondary">Structure only</Badge>` to `<Badge variant="secondary">Structure + full backup generation</Badge>`. Verify by reloading `/admin/database` in dev and confirming the panel renders, the badge text changed, and the existing `Scopes` and `Boundaries` cards are unchanged.

- [x] 4.3 Add an admin nav link in [`components/admin-pages/` sidebar or `app/admin/layout.tsx`](../../../../app/admin/layout.tsx) only if a sidebar entry for `/admin/database` does not already exist. If it already exists, leave it untouched. Verify by reloading any admin page and confirming the `Database` nav entry is present. **Already present** in [`components/admin-pages/admin-sidebar.tsx`](../../../../components/admin-pages/admin-sidebar.tsx) at line 84 (`{ title: "Database", url: "/admin/database", icon: Database }`); no change made.

## 5. Validation

- [x] 5.1 Run `npm run tsc` and verify exit 0. Re-run after every commit-equivalent change captured in this slice. (Agent-runnable per project rules.)

- [x] 5.2 Run `npm run lint` (the root command which targets `app/**/*.{js,ts,tsx}`) and any targeted lint on `lib/admin-database-backup.ts` and the new route file. Verify exit 0. (Agent-runnable per project rules.)

- [x] 5.3 Ask the user to run `npm run build` (per project rules the user runs the production build). Surface the output in the change summary once the user reports it. **User confirmed: build passed on 2026-10-19.**

- [x] 5.4 Manual browser smoke test passed as `admin` against `http://localhost:3000/admin/database` on 2026-10-19: clicking `Generate full backup` (with `BACKUP_PG_DUMP_BIN=/usr/lib/postgresql/17/bin/pg_dump` set in `.env.local` to match the production server's PostgreSQL 17 against the local client's PG 14) downloaded `development-2026-10-19T19-27-51-881Z.tar.gz`. `tar tzf` reported exactly the three required entries. The downloaded archive was extracted and spot-checked: `manifest.json` has all seven spec-mandated keys (`generatedAt`, `environment`, `scope`, `includedDomainsOrTables`, `formatVersion`, `generatorSource`, `restoreCompatibilityNotes`) with `formatVersion: "1"` and the eight-domain array, `README.txt` contains the three required substrings (`Restore steps:`, `UploadThing`, `manifest.json`), and `dump.sql` was emitted by `PostgreSQL 17.11 (Ubuntu 17.11-1.pgdg22.04+2)` with zero `OWNER TO` lines (--no-owner), zero `GRANT` lines (--no-acl), and 32 `CREATE TABLE` statements. The two `Log` rows (`database.backup.generate`, `database.backup.download`) are written by the same `tar stdout close` callback chain that returned the 200 response, so a successful download implies both rows landed (live DB inspection is left to the user via `npx prisma studio`). The two denial paths (anonymous redirect, non-admin 403) stay covered by the delta spec scenarios and the existing `requireAdminControl` / `authSession` helpers — they are not part of this manual pass per the user's narrow-scope decision on 2026-10-19. Record the result in the change archive notes.

## 6. Open question follow-ups (no-op if not needed)

- [ ] 6.1 If the production build surfaces a Neon pooler failure on `pg_dump` long-statement execution (i.e., the user-visible smoke test from task 5.4 reports a dump error), add a `BACKUP_DATABASE_URL` env support to `runPgDump` and document the env in the README; otherwise leave this task unchecked and capture the decision in the archive notes.

- [ ] 6.2 If a follow-up restore-compatibility feature lands before archive of this slice, revisit the `includedDomainsOrTables` array in `buildManifest` to align with the restore contract; otherwise leave this task unchecked and let the restore feature own the manifest list.
