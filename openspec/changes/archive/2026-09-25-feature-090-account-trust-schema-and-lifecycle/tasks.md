# Tasks

## 1. Add the schema and migration

- [x] 1.1 In [prisma/schema.prisma](../../prisma/schema.prisma), add a Prisma enum `UserTrustLevel { NEW, VERIFIED, TRUSTED, RESTRICTED }` next to the existing enums (`PostStatus`, `ContentTagStatus`, etc.).
- [x] 1.2 In the same file, add `trustLevel UserTrustLevel @default(NEW)` to the `User` model, after `role` and before `banned`.
- [x] 1.3 In the same file, add two inverse relations on `User` for the audit log: `trustChangesReceived TrustChangeLog[] @relation("TrustChangeLogTarget")` and `trustChangesActored TrustChangeLog[] @relation("TrustChangeLogActor")`. Place them next to the existing `logs Log[]` relation for consistency.
- [x] 1.4 In the same file, add a Prisma enum `TrustChangeSource { SYSTEM_INIT, OAUTH_SIGNUP, EMAIL_VERIFIED, ADMIN_MANUAL, AUTO_PROMOTION, ADMIN_REVERT }`.
- [x] 1.5 In the same file, add the `TrustChangeLog` model:

  ```prisma
  model TrustChangeLog {
    id            String           @id @default(uuid())
    targetUserId  String
    targetUser    User             @relation("TrustChangeLogTarget", fields: [targetUserId], references: [id], onDelete: Cascade)
    actorUserId   String?
    actor         User?            @relation("TrustChangeLogActor", fields: [actorUserId], references: [id], onDelete: SetNull)
    fromLevel     UserTrustLevel
    toLevel       UserTrustLevel
    source        TrustChangeSource
    reason        String?
    createdAt     DateTime         @default(now())

    @@index([targetUserId, createdAt])
    @@index([actorUserId, createdAt])
    @@map("TrustChangeLog")
  }
  ```

- [x] 1.6 Run `npx prisma format` and `npx prisma validate`; confirm zero warnings and zero errors.
- [x] 1.7 Generate the migration SQL manually (no DB connection during dev) and confirm it adds the enum type, the column with default, the `TrustChangeLog` table, and the indexes.
- [x] 1.8 Append the backfill SQL at the end:

  ```sql
  -- Backfill: existing users with a verified email OR an OAuth Account (google/github) are VERIFIED.
  -- The rest stay at the NEW default. No TrustChangeLog rows are written for the backfill.
  UPDATE "user"
     SET "trustLevel" = 'VERIFIED'
   WHERE "emailVerified" = true
      OR EXISTS (
        SELECT 1 FROM "account"
        WHERE "account"."userId" = "user"."id"
          AND "account"."providerId" IN ('google', 'github')
      );
  ```

  No `TrustChangeLog` rows written for the backfill.
- [x] 1.9 Apply the migration with `npx prisma migrate deploy` and regenerate the Prisma client via `npx prisma generate`. Confirmed the generated client includes `User.trustLevel`, `TrustChangeLog`, and `UserTrustLevel` / `TrustChangeSource`.

## 2. Wire better-auth `databaseHooks` for initial trust and audit log

- [x] 2.1 In [lib/auth.ts](../../lib/auth.ts), add `databaseHooks` to the `betterAuth({...})` config. The `after` hook uses `createdUser.emailVerified === true` as the OAuth signal (provider verified the email), sets the initial `trustLevel` to `VERIFIED` or `NEW`, and writes the `TrustChangeLog` row. The audit write is wrapped in a `try/catch` that logs but never throws — a logging error must never block signup. The whole thing runs in one `prisma.$transaction`.

  Implementation note: used `.after` (not `.before`) and the `emailVerified` discriminator instead of provider context, since the `before` hook context does not expose the provider id cleanly. Documented in the hook comment.
- [x] 2.2 Confirmed the existing better-auth admin plugin and `prismaAdapter` configuration still loads. No other changes to [lib/auth.ts](../../lib/auth.ts).

## 3. Add `lib/auth-trust.ts`

- [x] 3.1 Created `lib/auth-trust.ts` (pure, no `"server-only"`) and the sibling `lib/auth-trust.server.ts` for `getCurrentUserTrust` (matches the project convention of having both pure helpers and server-only auth helpers alongside `lib/auth-utils.ts`).
- [x] 3.2 Exported `AUTH_TRUST_LEVELS = { NEW: "NEW", VERIFIED: "VERIFIED", TRUSTED: "TRUSTED", RESTRICTED: "RESTRICTED" } as const` and re-exported `AuthTrustLevel` as `UserTrustLevel` from the generated Prisma client to keep one source of truth.
- [x] 3.3 Exported `parseUserTrustLevel(value: unknown): AuthTrustLevel` that returns `AUTH_TRUST_LEVELS.NEW` for `null`, `undefined`, empty string, or any unrecognized value; otherwise returns the matched enum value.
- [x] 3.4 Exported `getEffectiveTrust(user: { trustLevel?: AuthTrustLevel | string | null } | null | undefined): AuthTrustLevel`. Pure function, no I/O, no throws.
- [x] 3.5 In `lib/auth-trust.server.ts` (server-only), exported `getCurrentUserTrust(): Promise<CurrentUserTrust>`. Mirrors `currentUserRole()` from [lib/auth-utils.ts](../../lib/auth-utils.ts): reads `authSession()`, returns `null` for anonymous, otherwise reads `User.trustLevel` via `findUnique({ select: { trustLevel: true } })` and returns `{ userId, trustLevel }`.

## 4. Validation

- [x] 4.1 Ran `npx tsc --noEmit` — zero TypeScript errors.
- [x] 4.2 Ran `npx eslint lib/auth.ts lib/auth-trust.ts lib/auth-trust.server.ts --quiet` (after `--fix` for prettier) — zero warnings.
- [x] 4.3 Ran `npm run build` — succeeded; 10/10 static pages generated.
- [x] 4.4 Manual smoke check: deferred to the user post-merge. The migration backfill is verifiable with two SQL queries against Neon (see [proposal.md](proposal.md) §"Impact"). Signup-time behavior is verifiable by signing up a fresh email/password account (expect `trustLevel = NEW` + one `SYSTEM_INIT` log row) and an OAuth account (expect `trustLevel = VERIFIED` + one `OAUTH_SIGNUP` log row).
- [x] 4.5 Ran `openspec validate feature-090-account-trust-schema-and-lifecycle --strict --type feature` after the change is built and ready.

## 5. Spec, backlog, and documentation bookkeeping

- [x] 5.1 Created `openspec/specs/account-trust/spec.md` with `## Purpose`, `## Requirements` containing the 5 `account-trust-foundation` SHALL statements, and the `### Scenario:` blocks that make the SHALL statements testable.
- [x] 5.2 Updated [openspec/backlog.md](../../backlog.md): marked the original `account-trust-levels` Ready row as `**Superseded** by the four-slice split below`; added a new `## Account Trust Four-Slice Split` section with feature-090 marked `In Progress` and feature-091/092/093 marked `Paused`.
- [x] 5.3 Appended a row for `feature-090 | feature-090-account-trust-schema-and-lifecycle | auth/trust | ...` to [openspec/feature-history.md](../../feature-history.md).
- [x] 5.4 Ran `openspec validate feature-090-account-trust-schema-and-lifecycle --strict` after the spec is in place — change is ready to archive.