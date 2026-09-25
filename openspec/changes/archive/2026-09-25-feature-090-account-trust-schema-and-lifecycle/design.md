# Design

## Context

The project is on Prisma 7 (PostgreSQL) with a custom client output at `generated/prisma/`. Auth is better-auth with the admin plugin, social providers (Google + GitHub, configured in [lib/auth.ts](../../lib/auth.ts)), and the standard email/password flow. The `User` model already has `emailVerified Boolean @default(false)`, `role String @default("user")`, and the admin-plugin fields (`banned`, `banReason`, `banExpires`). There is no current trust concept; the only existing user-level capability is `role`.

The existing `Log` model in [prisma/schema.prisma](../../prisma/schema.prisma) is a small activity log for site-wide events (`createPost`, `goToLink`, etc.). Its shape — `action`, `userId`, `details` — does not fit a trust change log: we need both `targetUser` and `actorUser` relations, an enum for the source, and explicit from/to levels. A separate `TrustChangeLog` model is cleaner than overloading `Log`.

The codebase already has `lib/auth-utils.ts` with `currentUserRole()` and `requireAdmin()` patterns. The new trust helpers should mirror that style (same shape of read, same session handling) so the gate slice can swap one for the other without changing call sites.

There is no current `databaseHooks` usage in [lib/auth.ts](../../lib/auth.ts). The closest existing pattern is `prismaAdapter` for the database layer; better-auth's `databaseHooks` sit one level above that and run during the lifecycle of a better-auth operation. Adding them is additive and won't touch existing flows.

See [proposal.md](proposal.md) for motivation and scope.

## Goals / Non-Goals

**Goals:**

- Introduce a typed `UserTrustLevel` enum and a single column on `User` so every user has an explicit, readable trust state.
- Persist every trust change in `TrustChangeLog` with target, optional actor, from, to, source, optional reason, and timestamp.
- Auto-init the level on signup based on the provider, and log it as a `TrustChangeLog` row with `actor = null`.
- Backfill existing rows in one migration without losing information; no `TrustChangeLog` rows for the backfill (it's initial state, not a change).
- Expose a small, testable, typed helper surface (`AUTH_TRUST_LEVELS`, `parseUserTrustLevel`, `getEffectiveTrust`, `getCurrentUserTrust`) so later gate slices have a stable read path.
- Add the `account-trust-foundation` spec so later slices can reference observable SHALL statements instead of just code.

**Non-Goals:**

- No mutation gates, no quotas, no auto-promotion, no `/admin/users` UI. Those are slices 091-093.
- No change to `User.role`, `User.banned`, `User.banReason`, or the admin plugin's behavior.
- No change to `User.emailVerified` semantics — we read it once during backfill and once during the future email-verified promotion (slice 091).
- No new dependencies, no env changes, no auth-provider changes.
- No new public routes, no UI work, no copy changes.

## Decisions

### Decision 1: Enum column on `User`, not a side table

Use `trustLevel UserTrustLevel @default(NEW)` directly on `User` rather than a separate `AccountTrustState` row.

- **Why:** every page that needs the level would otherwise need a join. The level is a single, small, denormalized scalar. The audit trail lives in `TrustChangeLog`; the current state lives on `User`.
- **Alternative considered:** keep state in `TrustChangeLog` and read the latest row per user — too expensive on hot paths, no gain over a column.

### Decision 2: `TrustChangeLog` as a separate model, not overloading `Log`

The existing `Log` model has a one-row-per-event shape with `action: String`, `userId: String`, `details: String?`. Trust changes need two `User` relations (target + actor), typed `from`/`to`/`source`, and per-user indexes — none of which fit `Log` cleanly. A separate model keeps both readable.

- **Why separate:** the `Log` enum has narrow, established values (`createPost`, `updatePost`, `deletePost`, `goToLink`); adding trust actions would dilute it. A separate model is also easier to evolve independently.
- **Why not just JSON in `Log.details`:** the gate slice (091) will need to query "what changes did admin X make this month" — that wants a typed enum and an index, not a JSON blob.

### Decision 3: Better-auth `databaseHooks.user.create.before` + `.after`

The initial `trustLevel` is set in `databaseHooks.user.create.before` (which can mutate the user object before insert). The `TrustChangeLog` row is written in `databaseHooks.user.create.after` (which runs once the user is persisted and we have an ID).

- **Why split:** the `before` hook has the request context (provider info); the `after` hook has the user ID we need for the log row. Putting both in one place is awkward because the `before` hook doesn't have the new ID yet, and the `after` hook is the wrong place to mutate the user row (it's already inserted).
- **Why not a side-channel Prisma `User.create` wrapper:** better-auth bypasses direct Prisma calls — the source of truth for signup is better-auth itself. Wrapping better-auth is fragile; `databaseHooks` is the supported integration point.

### Decision 4: Backfill in the migration SQL, no `TrustChangeLog` rows for it

The migration:

1. Adds the `UserTrustLevel` enum.
2. Adds `User.trustLevel UserTrustLevel NOT NULL DEFAULT 'NEW'`.
3. Adds the `TrustChangeLog` table + `TrustChangeSource` enum + indexes.
4. Runs an `UPDATE "user" SET "trustLevel" = 'VERIFIED' WHERE "emailVerified" = true OR EXISTS (SELECT 1 FROM "account" WHERE "account"."userId" = "user"."id" AND "account"."providerId" IN ('google','github'));`.
5. Leaves the rest at `NEW` (the column default).

No `TrustChangeLog` rows are written for the backfill.

- **Why no backfill log:** the audit trail is "changes", and the backfill is initial-state. Writing one `SYSTEM_INIT` row per user would create ~10k rows on a real deployment with no useful signal — the row would say "from NEW to VERIFIED", but the user didn't change; the column was just initialized. The gate slice can recompute history by trusting pre-slice `User.createdAt` as the implicit `NEW → VERIFIED` instant for any user who was created via email/password with a later email-verification flow.
- **Alternative considered:** write one log row per migrated user with `actor = null` and `source = SYSTEM_INIT` — rejected for the noise reason above. We can revisit if feature-091's audit UI actually needs pre-trust history.

### Decision 5: `getEffectiveTrust` is a pure read; `getCurrentUserTrust` is the session-aware helper

`getEffectiveTrust(user)` takes a `User`-like object with `trustLevel` (defaulting to `NEW` when missing) and returns the level. It never reads the database and never throws. `getCurrentUserTrust()` wraps `authSession()` + a Prisma `findUnique` and returns `{ userId, trustLevel }` or `null` for anonymous viewers.

- **Why split:** the gate slice (091) needs both — pure read for callers that already have a user object, and a session-aware read for callers that only have a request. Mirroring `currentUserRole` keeps the surface consistent.
- **Why `getEffectiveTrust` instead of just reading `user.trustLevel`:** the slice defers `banned`/`role` folding into a single "effective trust" concept; using `getEffectiveTrust` from day one means later changes fold into one place without editing call sites.

### Decision 6: Spec delta lives under a new capability `account-trust-foundation`

Add `openspec/specs/account-trust/spec.md` with a single capability `account-trust-foundation` and SHALL requirements for the column, the audit log, the auto-init behavior, and the read helpers. Later slices add their own capabilities (`account-trust-gates`, `account-trust-quotas`, `account-trust-admin-users`) and reference this one.

- **Why a new capability instead of `account-trust`:** OpenSpec organizes by capability, and gates/quotas/admin UI have different stakeholders and observable surfaces. A monolithic `account-trust` capability would mix foundation-level guarantees with gate-level ones and make per-slice review harder.
- **Why `account-trust-foundation` (not `account-trust-schema`):** the spec covers behavior, not just schema. Foundation is the right word — schema + auto-init + read helpers + audit log, no gates.

## Risks / Trade-offs

- **Backfill is irreversible at the per-row level** — once we set `trustLevel = VERIFIED` on a row, we can't tell whether it was a verified email/password or an OAuth signup. Mitigation: the slice never deletes the `emailVerified` flag, so a one-line Prisma query can still distinguish "verified-by-OAuth" from "verified-by-email" if needed. The audit trail is unaffected: it only records changes, not backfills.
- **`databaseHooks.user.create.before` API stability** — better-auth's hook surface has changed between minor versions in the past. Mitigation: pin to the current better-auth version, lock the contract in `lib/auth.ts`, and add a targeted unit smoke that exercises both the OAuth and email/password paths locally.
- **Race between `.before` and `.after`** — if the `before` hook decides `VERIFIED` but the `after` hook fails to write the `TrustChangeLog` row, the user exists with a level and no log entry. Mitigation: the `after` hook runs in the same better-auth transaction as the user creation; we use Prisma's normal error path and let the transaction surface the error. The `before` hook only mutates data; the `after` hook is the audit write. Failure here is loud (signup fails) — preferred over a silent skip.
- **Existing email-password users with stale `emailVerified = false` and no OAuth account** — these become `NEW` at rollout. Their experience changes only if slice 091 gates mutations on `NEW`, which is intentional and the reason slice 091 is a separate, reviewable slice. No silent regression in this slice.
- **No automated browser test for signups** — mitigation: manual smoke as listed in tasks §4.4.

## Migration Plan

One forward migration `add_user_trust_level` (see proposal §Impact). The backfill is part of the migration; rollback uses the standard `Down` (`ALTER TABLE "user" DROP COLUMN "trustLevel"; DROP TABLE "TrustChangeLog"; DROP TYPE "UserTrustLevel"; DROP TYPE "TrustChangeSource";`). No data loss: pre-rollback, the only data on the new column is the backfilled `NEW` / `VERIFIED` (which is exactly the state we'd want to recompute from `emailVerified` + `Account.providerId` anyway), and `TrustChangeLog` is empty for pre-rollback activity.

Deployment order:

1. Run the migration.
2. Deploy the code change (Prisma client is regenerated automatically by `npm postinstall`).
3. New signups go through the new `databaseHooks` from the first request; existing users keep their backfilled level.

## Open Questions

None. Slice 091-093 each open their own questions as part of their own scope.