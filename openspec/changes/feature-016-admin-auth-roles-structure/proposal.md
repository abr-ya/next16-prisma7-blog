## Why

The project needs a flexible roles plan before global settings, file administration, and other sensitive controls grow beyond the current session-only boundary. This change documents the existing better-auth setup and decides how `/admin` can remain an authenticated creator workspace while selected operations become role-gated.

## What Changes

- Document the current registration and authentication behavior.
- Define the target role and permission vocabulary for creator-owned areas and truly admin-only controls.
- Identify which auth options are already present, incomplete, or intentionally deferred.
- Define how future sensitive admin operations should depend on roles once role support exists.
- Split role implementation, registration policy, and provider cleanup into follow-up slices.

Non-goals:

- No Prisma role migration in this planning slice.
- No changes to better-auth configuration, sign-in/sign-up pages, or admin route enforcement in this slice.
- No role-gating implementation for creator-owned `/admin` pages, `/admin/files`, or UploadThing settings in this slice.
- No new OAuth providers, email verification flow, password reset flow, invite flow, or account management UI in this slice.

## Capabilities

### New Capabilities

- `admin-auth-roles-structure`: Documents the current auth surface and defines the planned role, registration, provider, creator workspace, and sensitive admin-control model before role-gated implementation.

### Modified Capabilities

- None.

## Impact

- Affects future auth work around `lib/auth.ts`, `lib/auth-utils.ts`, better-auth routes, sign-in/sign-up pages, Prisma `User`, creator-owned `/admin` pages, and sensitive admin-only surfaces.
- Provides the dependency for future admin-only features such as UploadThing site settings, file ownership policy, storage quotas, and dashboard access.
- Establishes that current `/admin` access is session-gated and should remain available to authenticated creators, while sensitive global controls should become role-gated after implementation.
