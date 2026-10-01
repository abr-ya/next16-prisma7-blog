# Proposal

## Why

Verified accounts can currently create unlimited trips, photos, and tracks, and photo likes do not yet establish the promised progression to trusted status. This slice makes the initial verified-user limits enforceable and rewards sustained positive engagement without weakening the trust gates already in production.

## What Changes

- Enforce server-authoritative live-record quotas for non-administrator `VERIFIED` users: at most 3 trips, 30 `Photo` records, and 10 tracks; deletion frees a slot. `TRUSTED` users and administrators are not subject to these count limits.
- Prevent a user from liking their own published trip photo, and add a forward migration that removes historical self-like rows.
- Atomically promote an eligible `VERIFIED` photo owner to `TRUSTED` when their photos reach 10 likes. The threshold remains adjustable, a later unlike does not demote them, and `RESTRICTED` users are never auto-promoted.
- Add an administrator-only server mutation for explicitly setting a non-administrator account to `VERIFIED`, `TRUSTED`, or `RESTRICTED`, with the required trust-change audit record. The table and interface for that action remain feature-093 work.
- Evaluate already eligible persisted likes during rollout and after email verification so qualifying verified users are not missed.

## Capabilities

### New Capabilities

- `account-trust-quotas`: Verified-account live-resource quotas, safe automatic trust promotion, administrator trust-level mutations, and their data/audit boundaries.

### Modified Capabilities

- `outdoor-photo-likes`: Disallow self-likes for published trip photos while preserving private, one-like-per-user behavior for other eligible viewers.

## Impact

- Affected Prisma data: a narrow forward migration deletes self-like `PhotoLike` rows; existing `User.trustLevel` and `TrustChangeLog` records are reused with no schema addition expected.
- Affected server mutations: trip creation, track creation, public trip-photo contribution, photo-like creation, email-verification lifecycle, and the future admin-user management boundary.
- Affected public surfaces: quota or self-like denial is returned by existing mutation flows; no public like counts or trust status are exposed.
- Affected admin surface: no `/admin/users` UI in this slice; only the audited server-side mutation contract is established for feature-093.

## Non-goals

- Building the `/admin/users` table, search, badges, or status-change UI.
- Changing trust gates, comment rate limits, existing ownership/participant rules, or public-read access.
- Applying limits to `NEW`, `RESTRICTED`, `TRUSTED`, or administrator accounts beyond the existing gate policy.
- Introducing distinct-liker requirements, public popularity metrics, demotion after unlikes, or a generic reputation system.
