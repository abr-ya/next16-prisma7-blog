## Context

The current authentication surface uses better-auth with the Prisma adapter in `lib/auth.ts`. Email/password sign-in is enabled, and Google plus GitHub social providers are configured through environment variables. Auth routes are exposed through `app/api/auth/[...all]/route.ts`.

Users, sessions, accounts, and verification records are stored in the project's PostgreSQL database through Prisma models managed by the better-auth Prisma adapter. The UI has `/sign-in` and `/sign-up` pages under `app/(auth)`, both guarded by `requireNoAuth()`. Admin routes under `/admin` use `requireAuth()` in `app/admin/layout.tsx`, so any signed-in user can currently enter the admin shell. That shell should be treated as an authenticated creator workspace where users can manage their own posts, docs, videos, bookmarks, and files. The Prisma `User` model has no role or permission field yet.

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

### Decision: Store roles on the existing Prisma `User` model

The project already stores users in the application database through better-auth's Prisma adapter, so the first role implementation should add a persisted role field to the existing Prisma `User` model. This keeps authorization decisions close to content ownership, file ownership, and server-side data helpers that already use `session.user.id`.

The current storage choice is suitable for roles because the app owns the relational `User` row and can safely join or filter by role in server code. OAuth providers should remain account-authentication sources stored in `Account`, not the source of authorization truth.

Alternative considered: store roles in OAuth provider metadata or in a separate external auth service. That would split authorization away from the local content database and make owner/admin checks harder to audit.

### Decision: Align role storage with better-auth Admin plugin conventions

better-auth provides an Admin plugin with a `role` field on the `user` table, default `user` and `admin` roles, user-management endpoints, and custom access-control support. The role-storage implementation slice should evaluate adding that plugin and, if adopted, use its lowercase role strings (`user`, `admin`, and future `editor`) as the persisted role values.

Application authorization should still live in project helpers. The better-auth Admin plugin can provide the auth-owned role field and user-management API surface, while project code decides which content, file, UploadThing, backup, and moderation operations map to each role.

The Admin plugin should not be installed in this planning slice. It should be implemented in `feature-017-auth-admin-plugin-role-storage`, together with the required schema fields, generated Prisma client update, safe user defaults, manual first-admin promotion, and minimal server-side role helpers.

Alternative considered: define a separate Prisma enum such as `USER` and `ADMIN` without using better-auth Admin plugin role conventions. That keeps the model independent, but duplicates behavior that better-auth already exposes for role management and permissions.

### Decision: Plan a small first role vocabulary and defer editor implementation

The first implementation should start with a small active role vocabulary, likely `user` and `admin`, before adding fine-grained permissions. `user` should keep authenticated creator access, while `admin` should unlock sensitive global controls such as role management, site-wide UploadThing settings, all-file views, database backups, and moderation of other users' content.

An `editor` role should be planned but deferred. It should eventually allow cross-user content work such as reviewing, editing, or moderating posts, documentation, video bookmarks, comments, and content-linked media without granting system controls such as role management, global UploadThing settings, auth settings, storage limits, backups, or user administration.

Alternative considered: implement granular permissions immediately. That would be more flexible, but too broad for the current admin-auth foundation.

### Decision: Keep registration policy explicit

The project currently exposes a sign-up page and enables email/password auth. The preferred direction is to keep public registration possible, assign new users `user` by default, and require explicit elevation for `admin`.

Alternative considered: leave registration policy implicit. That would make role-gating ambiguous once admin-only features arrive.

### Decision: Keep public self-registration open

Public self-registration should continue to work after roles are introduced. New email/password users, GitHub users, Google users, and any later social-provider users should receive the ordinary `user` role by default, and no public sign-up path should grant elevated access automatically.

Alternative considered: make registration invite-only when roles are introduced. That may become useful later, but it is not required for the first role foundation if elevated roles require manual assignment.

### Decision: Add email verification without making it an access gate yet

The email/password follow-up should add mailbox-backed email verification, but the first version should not block ordinary signed-in users or administrator access solely because `emailVerified` is false. This gives the project verified-email infrastructure and UX without coupling it to the first role rollout.

Alternative considered: require verified email before admin access immediately. That is stricter, but it adds transactional-email reliability as a dependency for role rollout and can be revisited once the email flow is proven.

### Decision: Promote the first admin manually

When roles are implemented, existing users should be backfilled to `user`, and the first `admin` should be assigned manually through Prisma Studio or SQL after the migration. The first implementation should not add an `INITIAL_ADMIN_EMAIL` environment variable or automatically promote the first registered user.

Alternative considered: bootstrap the first admin from an environment variable or automatically promote the first registered account. Manual promotion is less automated, but avoids hidden production behavior and keeps the first role rollout explicit.

### Decision: Keep provider support separate from role assignment

Google and GitHub sign-in should be considered authentication providers, not authorization decisions. Users from any provider should receive the same default role policy until an admin changes it manually or a later invite flow grants a role.

Alternative considered: make a provider imply admin access. That would be brittle and hard to audit.

### Decision: Keep Google sign-in enabled

Google should remain part of the supported authentication surface alongside email/password and GitHub. The GitHub account-flow slice should not remove or deprecate Google; any later provider cleanup should be planned separately if real maintenance or UX issues appear.

Alternative considered: narrow social login to GitHub only. That would reduce provider surface area, but the current plan favors keeping useful sign-in options while treating providers as auth methods, not role signals.

### Decision: Split concrete account flows into explicit follow-up features

The project should keep email/password account flow and GitHub account flow as separate implementation slices. `feature-027-email-password-account-flow` should finish first-party account creation and sign-in with form UX, mailbox-backed email verification decisions, password reset boundaries, and user-facing auth states.

`feature-028-github-account-flow` should finish GitHub account creation and sign-in with provider configuration, callback behavior, email availability handling, and account-linking boundaries. Better Auth supports both directions: email/password through `emailAndPassword` and GitHub through `socialProviders.github`; this planning slice records the split without implementing either flow.

Alternative considered: treat auth flows as one broad implementation feature. That would mix form UX, transactional email, OAuth app configuration, provider edge cases, and account-linking policy into one larger slice.

### Decision: Defer account management

Dedicated account management UX, such as profile editing, connected account controls, changing email, and session/device management, should be planned later. It is not required for the role model, Admin plugin role storage, email/password account flow, or GitHub account flow.

Alternative considered: bundle account management into the near-term auth slices. That would be convenient for users, but it would broaden the first auth roadmap before registration, login, provider, and role storage behavior is stable.

### Decision: Roles gate sensitive operations, not the whole admin shell

Future helpers such as `requireAdmin()` should be used on sensitive pages/actions rather than replacing `requireAuth()` in `app/admin/layout.tsx`. Global UploadThing settings, storage totals, provider policy, all-user file dashboards, role management, and database backup controls should wait until role-gated admin access exists.

Alternative considered: make `/admin` role-gated as a whole. That is simpler to enforce, but it removes useful creator workflows from ordinary authenticated users.

## Risks / Trade-offs

- Current `/admin` is broad by design -> document creator-owned versus global admin surfaces clearly and avoid adding sensitive global controls before roles.
- Open registration plus future sensitive admin routes can surprise the site owner -> default future users to `user` and require explicit elevation for `admin`.
- Social providers can create duplicate or unexpected accounts depending on provider email behavior -> review GitHub email availability, provider app scopes, and account linking in `feature-028-github-account-flow`.
- Email/password flows need transactional email before verification or reset UX is complete -> keep mailbox-backed verification and password reset in `feature-027-email-password-account-flow`.
- Adding a role field to `User` later requires migration and defaulting existing users -> plan an explicit backfill/default role.
- Role data can drift if duplicated outside the application database -> keep the first role source of truth on the Prisma `User` model.
- better-auth Admin plugin roles are string-based and can contain multiple roles as comma-separated values -> keep the first project checks simple and document any multi-role behavior before using it.
- Fine-grained permissions may be needed later -> start with roles and leave permission tables as a possible later expansion.

## Migration Plan

1. Accept this planning spec without changing runtime auth behavior.
2. Follow up with `feature-017-auth-admin-plugin-role-storage` to evaluate and install the Better Auth Admin plugin, add role storage, and default existing users safely.
3. Follow up with a sensitive-operation access slice that introduces `requireAdmin()` and applies it only to admin-only pages/actions, while creator-owned `/admin` workflows remain session-gated.
4. Follow up with an editor-role slice only when cross-user content moderation is needed without system administration.
5. Follow up with `feature-027-email-password-account-flow` for email/password registration, login, mailbox verification, and password reset boundaries.
6. Follow up with `feature-028-github-account-flow` for GitHub account creation, login, provider setup, email handling, and account-linking boundaries.
7. Follow up with account management, invite-only registration, or provider cleanup only if later product review selects them.

Rollback for this planning slice is documentation-only. Runtime rollback applies only to future implementation slices.

## Open Questions

None for this planning slice.
