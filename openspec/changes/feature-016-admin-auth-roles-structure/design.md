## Context

The current authentication surface uses better-auth with the Prisma adapter in `lib/auth.ts`. Email/password sign-in is enabled, and Google plus GitHub social providers are configured through environment variables. Auth routes are exposed through `app/api/auth/[...all]/route.ts`.

The UI has `/sign-in` and `/sign-up` pages under `app/(auth)`, both guarded by `requireNoAuth()`. Admin routes under `/admin` use `requireAuth()` in `app/admin/layout.tsx`, so any signed-in user can currently enter the admin shell. The Prisma `User` model has no role or permission field yet.

This feature is a planning slice. It documents the current behavior and decides the target role/registration shape before implementation slices change the data model or route access.

## Goals / Non-Goals

**Goals:**

- Record the current registration, sign-in, provider, session, and admin access behavior.
- Define the target role vocabulary for the project.
- Define how admin-only routes should be protected after roles exist.
- Decide which registration modes should be supported or deferred.
- Identify follow-up slices for role storage, role-gated admin access, provider/account cleanup, and user/account management.

**Non-Goals:**

- No Prisma migration in this planning slice.
- No runtime auth behavior changes in this planning slice.
- No new providers, invite flow, password reset, email verification enforcement, or account settings UI in this planning slice.
- No file-dashboard role-gating implementation in this planning slice.

## Decisions

### Decision: Treat current `/admin` access as session-only

The current system protects `/admin` with `requireAuth()`, which means any authenticated user can access the admin layout. This should be documented as the current behavior, not treated as true admin authorization.

Alternative considered: infer admin status from access to `/admin`. That is unsafe because the schema has no role field and the code has no role check.

### Decision: Plan a small role vocabulary first

The first implementation should start with a small role vocabulary, likely `admin` and `user`, before adding fine-grained permissions. This is enough to separate personal authenticated users from site administrators for `/admin`, file dashboards, UploadThing settings, and future moderation surfaces.

Alternative considered: implement granular permissions immediately. That would be more flexible, but too broad for the current admin-auth foundation.

### Decision: Keep registration policy explicit

The project currently exposes a sign-up page and enables email/password auth. The planning work should decide whether public registration remains open, becomes invite-only, or stays enabled but assigns non-admin users by default.

Alternative considered: leave registration policy implicit. That would make role-gating ambiguous once admin-only features arrive.

### Decision: Keep provider support separate from role assignment

Google and GitHub sign-in should be considered authentication providers, not authorization decisions. Users from any provider should receive the same default role policy until an admin changes it or an invite grants a role.

Alternative considered: make a provider imply admin access. That would be brittle and hard to audit.

### Decision: Roles become a dependency for global settings

Global UploadThing settings, storage totals, provider policy, and site-wide file controls should wait until role-gated admin access exists. This keeps `feature-015` able to build the backend file foundation with the current admin shell, while later global controls can require real admin authorization.

## Risks / Trade-offs

- Current `/admin` is broader than the future intended admin-only model -> document this clearly and avoid adding sensitive global controls before roles.
- Open registration plus future admin routes can surprise the site owner -> default future users to non-admin unless explicitly elevated.
- Social providers can create duplicate or unexpected accounts depending on provider email behavior -> review better-auth account linking and provider policy in a follow-up.
- Adding a role field to `User` later requires migration and defaulting existing users -> plan an explicit backfill/default role.
- Fine-grained permissions may be needed later -> start with roles and leave permission tables as a possible later expansion.

## Migration Plan

1. Accept this planning spec without changing runtime auth behavior.
2. Follow up with a role-storage implementation slice that adds the `User.role` model field and defaults existing users safely.
3. Follow up with a route-access slice that introduces `requireAdmin()` and applies it to admin-only surfaces.
4. Follow up with registration/provider slices for invite-only registration, email verification, password reset, account management, or provider cleanup if selected.

Rollback for this planning slice is documentation-only. Runtime rollback applies only to future implementation slices.

## Open Questions

- Should public self-registration remain open after roles exist?
- Who becomes the first admin when the role field is introduced?
- Should the app require verified email before admin access?
- Should GitHub and Google both remain enabled long-term?
- Should password reset and account management be part of the near-term auth roadmap?
