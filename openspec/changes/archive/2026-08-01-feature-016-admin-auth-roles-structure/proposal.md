## Why

The project needs a flexible roles plan before global settings, file administration, and other sensitive controls grow beyond the current session-only boundary. This change documents the existing better-auth setup and decides how `/admin` can remain an authenticated creator workspace while selected operations become role-gated.

## What Changes

- Document the current registration and authentication behavior.
- Document that users are persisted in the project's PostgreSQL database through the better-auth Prisma adapter.
- Define the target role and permission vocabulary for creator-owned areas and truly admin-only controls.
- Plan a future `EDITOR` role for cross-user content moderation without implementing it in the first role slice.
- Decide whether future role storage should follow better-auth Admin plugin conventions.
- Identify which auth options are already present, incomplete, or intentionally deferred.
- Define how future sensitive admin operations should depend on roles once role support exists.
- Split role implementation, email/password account flow, GitHub account flow, registration policy, and provider cleanup into follow-up slices.

Non-goals:

- No Prisma role migration in this planning slice.
- No changes to better-auth configuration, sign-in/sign-up pages, or admin route enforcement in this slice.
- No Better Auth Admin plugin installation in this slice; that belongs to `feature-017-auth-admin-plugin-role-storage`.
- No role-gating implementation for creator-owned `/admin` pages, `/admin/files`, or UploadThing settings in this slice.
- No email/password form-flow completion, mailbox-backed email verification, password reset flow, GitHub provider completion, invite flow, or account management UI in this slice.

## Capabilities

### New Capabilities

- `admin-auth-roles-structure`: Documents the current auth surface and defines the planned role, registration, provider, creator workspace, and sensitive admin-control model before role-gated implementation.

### Modified Capabilities

- None.

## Impact

- Affects future auth work around `lib/auth.ts`, `lib/auth-utils.ts`, better-auth routes, sign-in/sign-up pages, Prisma `User`, creator-owned `/admin` pages, and sensitive admin-only surfaces.
- Confirms the current user storage model is suitable for persisted roles because the project owns the Prisma `User` table.
- Provides the dependency for future admin-only features such as UploadThing site settings, file ownership policy, storage quotas, and dashboard access.
- Establishes that current `/admin` access is session-gated and should remain available to authenticated creators, while sensitive global controls should become role-gated after implementation.
