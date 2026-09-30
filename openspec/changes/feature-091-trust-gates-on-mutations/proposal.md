# Proposal

## Why

Account trust levels already exist but currently do not affect what a signed-in user can do. This change makes the first safety boundary real: new and restricted accounts remain able to read public content while write actions require sufficient trust, with a consistent rate limit for comment creation.

## What Changes

- **BREAKING** Block `NEW` and `RESTRICTED` non-administrator accounts from liking photos, creating comments, creating trips, and uploading or creating photos and tracks; reject the mutation server-side before it writes data.
- Preserve public reading and existing owner/admin authorization rules; `VERIFIED` and `TRUSTED` ordinary accounts retain the actions currently available to them, and administrators retain ordinary and administrative capabilities regardless of trust level.
- Add one shared, server-enforced 15-second interval between comment creations by the same user, covering current video and published-trip photo comment domains.
- Provide safe, actionable denial and rate-limit feedback without revealing private target data or bypassing existing visibility checks.

## Capabilities

### New Capabilities

- `account-trust-gates`: Server-authoritative write gates and comment-creation anti-flood behavior based on the account-trust level.

### Modified Capabilities

- `account-trust`: Replace the foundation-only no-gates guarantee with the active trust-gate boundary.

## Impact

- Affected server mutations in trip, track, photo-contribution, photo-like, video-comment, and photo-comment workflows; their existing public routes and UI surfaces retain their current visibility rules.
- Affected shared auth helpers: current trust lookup, administrator role detection, and a reusable comment-write guard.
- No new Prisma model or migration is expected; the gate reads the existing `User.trustLevel` and recent `Comment` timestamps.
- No administrator UI, verified-user quotas, self-like cleanup, or automatic promotion is included; those remain feature-092 and feature-093 work.

## Non-goals

- Limiting reads of public content, hiding existing published content, or changing sign-in flow.
- Blocking updates or deletion of existing user-owned content in this slice.
- Applying a count quota to verified accounts, promoting users, or changing their trust status.
- Adding a client-only gate that could substitute for server authorization.
