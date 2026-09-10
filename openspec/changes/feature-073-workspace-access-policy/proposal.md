## Why

Authenticated users, owners, trip participants, and administrators currently have overlapping capabilities whose routes, sidebar visibility, and server actions are not explained or enforced consistently. The application needs one observable access policy so users know where to work and sensitive actions cannot be reached merely by knowing an endpoint.

## What Changes

- Define the active role vocabulary as ordinary authenticated `user` and persisted `admin`; keep future `editor` or reputation roles out of this change.
- Publish a concise, repository-maintained access matrix covering public visitors, signed-in users, resource owners, accepted trip participants, and administrators across the current workspace routes and sensitive actions.
- Divide `/admin` navigation into a personal workspace for owner-scoped content and an administrator-only control section, with accurate empty/denied states.
- Apply consistent server-side authorization to the audited post, track, trip, photo, file, and site-control actions: owner-scoped content remains available to its owner; cross-user, association, lifecycle, and global-control operations require admin privileges.
- Make direct route/action access obey the same policy as the UI, including clear denial behavior and no protected data leakage.

### Non-goals

- Adding role-management UI, self-service promotion, new persisted roles, bans, impersonation, or organization/team permissions.
- Changing public reading rules, existing trip participant invitations, or granting participants broad workspace/admin access.
- Designing reputation-based quotas or content moderation workflows.
- Reworking every content domain beyond the audited admin/workspace routes and actions.

## Capabilities

### New Capabilities

- `workspace-access-policy`: A documented, enforceable policy for the personal workspace and administrator controls, including route/action access matrix and owner/admin boundaries.

### Modified Capabilities

- `admin-auth-roles-structure`: Make the established `user`/`admin` role model explicit for current workspace behavior and retain `/admin` as session-gated personal workspace rather than an administrator-only shell.

## Impact

- Affected routes: `/admin`, `/admin/posts`, `/admin/tracks`, `/admin/trips`, `/admin/photos`, `/admin/files`, and other administrator control destinations surfaced by the sidebar.
- Affected server areas: auth-role helpers, admin layout/sidebar, and audited data actions for posts, tracks, trips, photos, and files.
- Affected documentation: an access matrix colocated with the feature/project documentation and linked from the admin workspace where appropriate.
- No database migration or new dependency is expected; the existing persisted `User.role` remains the role source of truth.
