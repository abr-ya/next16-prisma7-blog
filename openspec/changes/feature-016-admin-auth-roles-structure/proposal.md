## Why

Admins need a clear authentication and roles plan before file dashboards, storage settings, and other admin-only features grow beyond the current session-only admin boundary. This change documents the existing better-auth setup and decides what registration, provider, role, and admin access work should happen next.

## What Changes

- Document the current registration and authentication behavior.
- Define the target role and permission vocabulary for admin-only areas.
- Identify which auth options are already present, incomplete, or intentionally deferred.
- Define how future admin-only pages should depend on roles once role support exists.
- Split role implementation, registration policy, and provider cleanup into follow-up slices.

Non-goals:

- No Prisma role migration in this planning slice.
- No changes to better-auth configuration, sign-in/sign-up pages, or admin route enforcement in this slice.
- No role-gating implementation for `/admin/files` or UploadThing settings in this slice.
- No new OAuth providers, email verification flow, password reset flow, invite flow, or account management UI in this slice.

## Capabilities

### New Capabilities

- `admin-auth-roles-structure`: Documents the current auth surface and defines the planned role, registration, provider, and admin access model before role-gated implementation.

### Modified Capabilities

- None.

## Impact

- Affects future auth work around `lib/auth.ts`, `lib/auth-utils.ts`, better-auth routes, sign-in/sign-up pages, Prisma `User`, and `/admin` route access.
- Provides the dependency for future admin-only features such as UploadThing site settings, file ownership policy, storage quotas, and dashboard access.
- Establishes that current `/admin` access is session-gated, while future admin-only access should become role-gated after implementation.
