# Proposal

## Why

Today the project has no concept of account trust. The only user-level capability flag is `User.role` (`user` / `admin`, from better-auth's admin plugin). In practice a brand-new email/password sign-up can immediately like, comment, create trips, and upload photos and GPX tracks, with no signal that the email address was actually owned by the account holder. OAuth (Google/GitHub) sign-ups are slightly better — better-auth sets `User.emailVerified = true` after a successful provider callback — but the codebase never reads `emailVerified` to gate anything, so a fresh OAuth account is functionally the same as a fresh email/password account.

The backlog already has the full trust-levels scope under one big "Ready" candidate (`account-trust-levels`). That scope — levels, quotas on trips/photos/tracks, 15-second comment anti-flood across every comment domain, an audit trail, and an `/admin/users` table — is too large for a single reviewable slice and risks leaking an unsafe intermediate state (e.g. levels exist but no gates, so a `NEW` user can still comment). This feature ships only the foundation: the column, the audit log, the auto-init logic, and the read helper. Every consumer-facing gate, quota, and UI surface is split into later features that depend on this one.

## What Changes

- Add a Prisma enum `UserTrustLevel { NEW, VERIFIED, TRUSTED, RESTRICTED }` and a single `User.trustLevel UserTrustLevel @default(NEW)` column. Trust is independent from `role`; an `admin` can be `NEW` and an `admin` can still be `RESTRICTED` without losing their admin capabilities (enforced in later slices).
- Add a Prisma model `TrustChangeLog` with two relations to `User` (target + actor), the `from` and `to` levels, a `source` enum (`SYSTEM_INIT`, `OAUTH_SIGNUP`, `EMAIL_VERIFIED`, `ADMIN_MANUAL`, `AUTO_PROMOTION`, `ADMIN_REVERT`), an optional `reason`, and `createdAt`. Two indexes: `(targetUserId, createdAt)` and `(actorUserId, createdAt)`.
- Migrate existing rows: every `User` with `emailVerified = true` OR an `Account` with `providerId ∈ {google, github}` is set to `VERIFIED`; everyone else stays at the `NEW` default. No `TrustChangeLog` rows are written for the backfill (these are initial states, not changes).
- Add better-auth `databaseHooks.user.create.before` to `lib/auth.ts` so the just-inserted `User` row carries the right initial `trustLevel` based on the signup provider: Google/GitHub → `VERIFIED`, anything else → `NEW`. After the user is created, write a `TrustChangeLog` row with `source = OAUTH_SIGNUP` (Google/GitHub) or `source = SYSTEM_INIT` (email/password) and `actor = null`. The actor stays `null` for system-driven changes; admin-driven changes (later slice) will set it.
- Add `lib/auth-trust.ts` exporting:
  - `AUTH_TRUST_LEVELS` const + `AuthTrustLevel` type (mirrors the Prisma enum, used in non-Prisma code).
  - `parseUserTrustLevel(value)` — tolerant parser (`"new"`, `"NEW"`, `null`, undefined → `NEW`).
  - `getEffectiveTrust(user)` — pure read; takes a `User`-like object with `trustLevel` (defaulting to `NEW` when missing), returns the level. For slice A this is just a typed alias around the column read; later slices will fold `banned`/`role` into "effective trust" without changing the call sites.
  - `getCurrentUserTrust()` — server-only helper that reads the current session via `authSession()` and returns `{ userId, trustLevel }` or `null` for anonymous viewers. Mirrors `currentUserRole`'s shape so future gate slices can swap one for the other.
- Add the spec delta `account-trust-foundation` under `openspec/specs/account-trust/spec.md` with SHALL requirements for the column, the audit log, the auto-init behavior, and the read helper. The slice ships observable guarantees for foundation-level surfaces only.

### Non-goals

- No mutation gates: a `NEW` or `RESTRICTED` user can still like, comment, create trips, and upload photos/tracks in this slice. Feature-091 adds the gates.
- No quotas on `live trips / Photos / tracks` for `VERIFIED` users. Feature-092 adds them.
- No auto-promotion from 10 likes. Feature-092 adds it.
- No `/admin/users` table and no admin status-change action. Feature-093 adds it.
- No 15-second per-user comment anti-flood. Feature-091 adds it.
- No change to `User.role`, `User.banned`, or `User.banReason`. Better-auth admin plugin keeps owning those.
- No change to `User.emailVerified` semantics — we read it for auto-init only.
- No new UI; no copy changes; no env changes; no new dependencies.

## Capabilities

### New Capabilities

- `account-trust-foundation` — defines `User.trustLevel`, `TrustChangeLog`, the auto-init behavior on signup, the migration backfill, and the read helpers. Observable requirements:
  - Every `User` row has a `trustLevel` of `NEW`, `VERIFIED`, `TRUSTED`, or `RESTRICTED`.
  - A user created via Google or GitHub has `trustLevel = VERIFIED` immediately after signup.
  - A user created via email/password has `trustLevel = NEW` until their email is verified (later slice promotes it).
  - Every change to `User.trustLevel` writes a `TrustChangeLog` row (except the migration backfill, which is a one-shot state-init not a change).
  - `getCurrentUserTrust()` returns the current user's level or `null` for anonymous viewers.
  - `getEffectiveTrust(user)` is a pure read and never throws on missing data.

### Modified Capabilities

None.

## Impact

- Affected code:
  - `prisma/schema.prisma` — add `UserTrustLevel` enum, add `User.trustLevel`, add `TrustChangeLog` model + `TrustChangeSource` enum, add two `User` relations.
  - `prisma/migrations/<timestamp>_add_user_trust_level/migration.sql` — new migration: add enum type, add `trustLevel` column with default, add `TrustChangeLog` table + enum, backfill existing rows, add indexes.
  - `lib/auth.ts` — add `databaseHooks.user.create.before` that injects the initial `trustLevel` based on the provider, and `databaseHooks.user.create.after` that writes the `TrustChangeLog` row.
  - `lib/auth-trust.ts` — new file with the helpers above.
  - `generated/prisma/` — auto-regenerated by `npm postinstall` (Prisma client). Do not edit manually.
  - `openspec/specs/account-trust/spec.md` — new spec under the new `account-trust-foundation` capability.
  - `openspec/backlog.md` — on completion, mark the `account-trust-levels` candidate as superseded into four numbered slices; this is slice 1 of 4.
  - `openspec/feature-history.md` — append a row for `feature-090`.
- Affected routes: none yet. This slice is foundation-only.
- Affected data: every existing `User` row gains a `trustLevel` (`NEW` or `VERIFIED`). No other model touched. No destructive changes.
- No new dependencies, no env changes, no auth-provider changes.
- Validation: `npm run tsc`, `npx prisma format`, `npx prisma generate`, targeted ESLint for `lib/auth.ts` + `lib/auth-trust.ts`, `npm run build`. Plus a manual smoke: sign up a fresh email/password account and confirm `trustLevel = NEW` and a `SYSTEM_INIT` `TrustChangeLog` row exists; sign up (or simulate) a Google/GitHub signup and confirm `trustLevel = VERIFIED` and an `OAUTH_SIGNUP` log row exists.
- Rollback: a single `git revert` removes the code change; the migration `Down` is `ALTER TABLE "user" DROP COLUMN "trustLevel"; DROP TABLE "TrustChangeLog"; DROP TYPE "UserTrustLevel";` and the down migration of the enum change. Backfill is not reversible per row (you can only guess what the original `emailVerified` / OAuth state was at the time, but since we only ever write `VERIFIED`/`NEW` in the backfill, no information is lost compared to pre-migration state — every `VERIFIED` row is justified by a real email verification or real OAuth account).