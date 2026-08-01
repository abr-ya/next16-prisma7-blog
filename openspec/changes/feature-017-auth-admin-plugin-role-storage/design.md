## Context

The accepted `admin-auth-roles-structure` spec defines `/admin` as an authenticated creator workspace and selects persisted first-party roles on the Prisma `User` model. It also names Better Auth Admin plugin conventions as the preferred role-storage direction, while deferring plugin installation to this implementation slice.

The current app uses Better Auth with the Prisma adapter in `lib/auth.ts`, the client from `better-auth/react` in `lib/auth-client.ts`, and session helpers in `lib/auth-utils.ts`. Prisma stores users, sessions, accounts, and verification records in PostgreSQL. The current `User` model has no role, ban-status, or ban-metadata fields, `Session` has no impersonation field, and `requireAuth()` gates `/admin` by session presence only.

Better Auth Admin plugin provides `user` and `admin` role conventions, admin endpoints such as set-role/list-users, and plugin schema fields. With the Prisma adapter, Better Auth schema generation can be used as a reference, but database migration must be applied through Prisma migrations, not Better Auth's built-in migrate flow.

## Goals / Non-Goals

**Goals:**

- Install Better Auth Admin plugin on the server auth configuration.
- Add the matching admin client plugin where role/admin typing is useful.
- Add persisted role storage to the existing Prisma `User` model with Better Auth-compatible role strings.
- Add the other Admin plugin storage fields required by the installed plugin schema without exposing their UI capabilities.
- Default existing users and new users to `user`.
- Document the manual first-admin promotion path through Prisma Studio or SQL.
- Add minimal server-only role helpers for future sensitive operations.
- Preserve broad `/admin` authenticated creator access.

**Non-Goals:**

- No admin role-management UI.
- No broad rollout of admin-only checks across all `/admin` routes.
- No email/password, GitHub, Google, invite, verification, reset, or account-management changes.
- No `editor` implementation.
- No use of Better Auth impersonation, ban/unban, user deletion, or password/email admin actions in project UI.

## Decisions

### Decision: Use Better Auth Admin plugin role storage

Add the Better Auth Admin plugin to `lib/auth.ts` and align the persisted auth storage fields with the installed plugin schema. The first active role values are `user` and `admin`; `editor` remains planned but unused.

The installed plugin schema requires `User.role`, `User.banned`, `User.banReason`, `User.banExpires`, and `Session.impersonatedBy`. This slice should add those fields for compatibility, while keeping ban and impersonation behavior out of project UI scope.

Alternative considered: add a project-owned Prisma enum without Better Auth Admin plugin. That would work for simple checks, but would split from Better Auth's role-management conventions and make future user-management features harder to adopt.

### Decision: Store roles as Better Auth-compatible strings

Use a string role field on the existing Prisma `User` model rather than a Prisma enum. Better Auth Admin plugin supports string roles and can represent multiple roles as comma-separated strings; this slice should keep project helpers to single-role `user`/`admin` semantics unless multi-role behavior is explicitly designed later.

Alternative considered: Prisma enum `USER`/`ADMIN`. It is stricter, but conflicts with Better Auth's lowercase string conventions and future custom-role behavior.

### Decision: Default every user to `user`

The Prisma schema and migration should make `user` the safe default for existing and new users. Public registration remains open, but no auth provider or registration path may create an elevated role automatically.

Alternative considered: leave existing users with `NULL` roles and handle nulls in helper code. That increases authorization ambiguity and creates avoidable edge cases.

### Decision: First admin is promoted manually

The rollout should include a documented manual promotion step using Prisma Studio or SQL after the migration. The implementation must not promote the first registered user and must not add `INITIAL_ADMIN_EMAIL` bootstrap behavior in this slice.

Alternative considered: env-based bootstrap. It is convenient, but the accepted planning decision chose manual promotion to keep production behavior explicit.

### Decision: Add minimal project role helpers

Add server-only helpers in `lib/auth-utils.ts` or a nearby auth helper module that can read the current session/user role and enforce admin-only access for future sensitive pages/actions. Do not replace `requireAuth()` in `app/admin/layout.tsx`; creator-owned admin routes remain session-gated.

Alternative considered: rely only on Better Auth admin endpoints. The project still needs domain-specific helpers for content ownership, UploadThing settings, backups, and other sensitive operations.

### Decision: Keep admin plugin endpoints out of project UI

The plugin can expose admin APIs, but this slice should not add UI controls for creating users, banning users, impersonation, deleting users, setting emails/passwords, or bulk user management. The only expected role change operation in this slice is documented manual first-admin promotion outside the app UI.

Alternative considered: build a user-management page now. That would pull in role management UX, audit concerns, and safer admin workflows before the minimal role foundation is proven.

## Risks / Trade-offs

- Better Auth plugin schema may include fields beyond `role` -> compare generated schema/docs before writing the Prisma migration and keep only required fields for the selected plugin behavior.
- Better Auth role values are string-based -> centralize role constants/helpers to avoid typos in authorization checks.
- Multi-role strings can complicate checks -> treat roles as single-value `user` or `admin` in this slice and document multi-role support as deferred.
- Manual first-admin promotion can be forgotten -> include exact Prisma Studio/SQL instructions in the implementation notes or closeout.
- Connecting admin plugin endpoints increases sensitive surface area -> do not expose new admin UI and verify only admin users can call plugin admin operations.
- Schema changes affect Better Auth session typing -> run TypeScript, Prisma generation, lint, and local build validation.

## Migration Plan

1. Update Better Auth server/client plugin configuration.
2. Use Better Auth schema generation/docs and the installed plugin schema as a reference for the required Admin plugin schema shape.
3. Add `User.role`, `User.banned`, `User.banReason`, `User.banExpires`, and `Session.impersonatedBy` with safe defaults/nullability and create a project-owned Prisma migration.
4. Regenerate the Prisma client.
5. Add minimal role constants and server-only helpers.
6. Validate that ordinary authenticated users can still enter creator-owned `/admin` routes.
7. Promote the first admin manually with Prisma Studio or SQL in the target environment.

Rollback: remove the admin plugin configuration and helper usage, then apply a follow-up Prisma migration that drops the role field only if no deployed code depends on it. Do not reset database state.

## Open Questions

None for this slice.
