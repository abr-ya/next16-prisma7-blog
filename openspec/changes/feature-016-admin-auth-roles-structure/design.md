## Context

The current authentication surface uses better-auth with the Prisma adapter in `lib/auth.ts`. Email/password sign-in is enabled, and Google plus GitHub social providers are configured through environment variables. Auth routes are exposed through `app/api/auth/[...all]/route.ts`.

The UI has `/sign-in` and `/sign-up` pages under `app/(auth)`, both guarded by `requireNoAuth()`. Admin routes under `/admin` use `requireAuth()` in `app/admin/layout.tsx`, so any signed-in user can currently enter the admin shell. That shell should be treated as an authenticated creator workspace where users can manage their own posts, docs, videos, bookmarks, and files. The Prisma `User` model has no role or permission field yet.

This feature is a planning slice. It documents the current behavior and decides the target role/registration shape before implementation slices change the data model or route access.

## Goals / Non-Goals

**Goals:**

- Record the current registration, sign-in, provider, session, and admin access behavior.
- Define the target role vocabulary for the project.
- Define which `/admin` surfaces stay available to authenticated creators and which operations require elevated roles.
- Decide which registration modes should be supported or deferred.
- Identify follow-up slices for role storage, role-gated admin access, provider/account cleanup, and user/account management.

**Non-Goals:**

- No Prisma migration in this planning slice.
- No runtime auth behavior changes in this planning slice.
- No new providers, invite flow, password reset, email verification enforcement, or account settings UI in this planning slice.
- No file-dashboard role-gating implementation in this planning slice.

## Decisions

### Decision: Treat `/admin` as an authenticated creator workspace

The current system protects `/admin` with `requireAuth()`, which means any authenticated user can access the admin layout. This should remain the broad boundary for creator-owned workflows such as posts, docs, videos, bookmarks, comments, and personal files.

Alternative considered: block `/admin` for non-admin users once roles exist. That would conflict with the product goal of letting ordinary users create and manage their own content.

### Decision: Plan a small role vocabulary first

The first implementation should start with a small role vocabulary, likely `ADMIN` and `USER`, before adding fine-grained permissions. `USER` should keep authenticated creator access, while `ADMIN` should unlock sensitive global controls such as role management, site-wide UploadThing settings, all-file views, database backups, and moderation of other users' content.

Alternative considered: implement granular permissions immediately. That would be more flexible, but too broad for the current admin-auth foundation.

### Decision: Keep registration policy explicit

The project currently exposes a sign-up page and enables email/password auth. The preferred direction is to keep public registration possible, assign new users `USER` by default, and require explicit elevation for `ADMIN`.

Alternative considered: leave registration policy implicit. That would make role-gating ambiguous once admin-only features arrive.

### Decision: Keep provider support separate from role assignment

Google and GitHub sign-in should be considered authentication providers, not authorization decisions. Users from any provider should receive the same default role policy until an admin changes it or an invite grants a role.

Alternative considered: make a provider imply admin access. That would be brittle and hard to audit.

### Decision: Roles gate sensitive operations, not the whole admin shell

Future helpers such as `requireAdmin()` should be used on sensitive pages/actions rather than replacing `requireAuth()` in `app/admin/layout.tsx`. Global UploadThing settings, storage totals, provider policy, all-user file dashboards, role management, and database backup controls should wait until role-gated admin access exists.

Alternative considered: make `/admin` role-gated as a whole. That is simpler to enforce, but it removes useful creator workflows from ordinary authenticated users.

## Risks / Trade-offs

- Current `/admin` is broad by design -> document creator-owned versus global admin surfaces clearly and avoid adding sensitive global controls before roles.
- Open registration plus future sensitive admin routes can surprise the site owner -> default future users to `USER` and require explicit elevation for `ADMIN`.
- Social providers can create duplicate or unexpected accounts depending on provider email behavior -> review better-auth account linking and provider policy in a follow-up.
- Adding a role field to `User` later requires migration and defaulting existing users -> plan an explicit backfill/default role.
- Fine-grained permissions may be needed later -> start with roles and leave permission tables as a possible later expansion.

## Migration Plan

1. Accept this planning spec without changing runtime auth behavior.
2. Follow up with a role-storage implementation slice that adds the `User.role` model field and defaults existing users safely.
3. Follow up with a sensitive-operation access slice that introduces `requireAdmin()` and applies it only to admin-only pages/actions, while creator-owned `/admin` workflows remain session-gated.
4. Follow up with registration/provider slices for invite-only registration, email verification, password reset, account management, or provider cleanup if selected.

Rollback for this planning slice is documentation-only. Runtime rollback applies only to future implementation slices.

## Open Questions

- Should public self-registration remain open with `USER` defaults after roles exist?
- Who becomes the first admin when the role field is introduced?
- Should the app require verified email before admin access?
- Should GitHub and Google both remain enabled long-term?
- Should password reset and account management be part of the near-term auth roadmap?
