## Context

See `proposal.md` for motivation. The role source already has persisted `user` and `admin` values, while `/admin` is session-gated by design as a creator workspace. Current modules mix that intended boundary with inconsistent individual checks: photos/files use administrator checks, posts/tracks/trips use ownership checks in some actions, and some pages compose helpers with incompatible roles. Sidebar visibility cannot secure server actions.

## Goals / Non-Goals

**Goals:**

- Make two active roles and resource scopes legible to users and maintainers.
- Preserve ordinary users' personal creation workflows without exposing cross-user or site-wide control.
- Use one audited policy source for route rendering, navigation, and direct server action checks.

**Non-Goals:**

- Change the persisted role schema or introduce `editor`.
- Turn trip participants into workspace administrators or add an access-management screen.
- Expand the audit into unrelated public APIs or auth-provider flows.

## Decisions

### Treat `/admin` as an authenticated workspace, not an admin-only shell

Keep the shared `/admin` layout session-gated, but split navigation and page surfaces into Personal workspace (own posts, tracks, trips) and Administrator controls (cross-user photos/associations, file lifecycle, map review, settings, backups). Each route and action still independently verifies its required scope.

Alternative: require `admin` for the entire `/admin` layout. This would remove ordinary users' existing owner-scoped authoring workflows and conflict with the established role model.

### Use role plus resource scope for every audited mutation

Adopt a small authorization vocabulary: authenticated user, resource owner, accepted trip participant, and administrator. Helpers must load the target resource with its owner or membership context, rather than trust client-provided ids. Admin override is explicit; participation only applies to the named trip contribution operation. A photo owner may refresh the EXIF metadata and review coordinates for their own photo when it is linked to the named published trip; the trip creator alone does not receive that authority.

Alternative: rely on route guards or hide UI controls. Either approach leaves direct server-action calls and data helpers inconsistent.

### Publish a compact matrix as the policy source

Add a maintained markdown matrix that lists audited routes/actions, allowed actors, scope predicate, and denial result. The implementation uses it to select audits and tests; it is not generated runtime configuration. Sidebar labels mirror the categories but do not duplicate authorization logic.

Alternative: encode the policy only in code. That prevents product owners from easily reviewing who can do what and makes accidental inconsistency harder to detect.

### Correct existing inconsistencies in focused domain slices

Audit posts, tracks, trips, photos, files, map-review, and dashboard/sidebar flows. Preserve owner CRUD where intended, add missing owner checks (including post read/update and own-photo EXIF/coordinate operations), and move or hide cross-user association controls from non-admin personal pages. Do not broaden administrator access to other users' personal content except where the matrix explicitly grants a management action.

## Risks / Trade-offs

- A route currently combines personal and admin data → Split its data query/control section so ordinary users receive only owner-scoped projections.
- Fixing missing checks can reveal previously reachable UI paths as denied → Present a clear personal-workspace alternative or safe denial, and verify direct actions.
- Matrix can become stale → Include it in this feature's validation and require updates with later workspace access changes.
- Ownership errors can break legitimate participant contribution → Keep participant checks limited to their existing public trip workflow and test them separately.

## Migration Plan

1. No database migration: retain existing `User.role` data and content ownership.
2. Inventory existing routes/actions and publish the approved matrix before changing guards.
3. Apply server checks and matching UI/data-projection changes in small audited groups.
4. Roll back code changes if necessary; no role or content data needs reversal.
