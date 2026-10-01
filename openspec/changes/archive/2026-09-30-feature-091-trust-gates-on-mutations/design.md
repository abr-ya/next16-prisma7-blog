# Design

## Context

Feature-090 already persists an explicit trust level and exposes a server-only current-user trust helper. Mutation entry points are currently spread across trip, track, photo contribution, photo-like, video-comment, and photo-comment modules; each retains its own resource visibility and ownership checks. Comments use one database table with either a video or photo target, allowing a single anti-flood boundary across both domains without a new data model.

## Goals / Non-Goals

**Goals:**

- Enforce the specified trust boundary at server mutation entry points, independent of client UI state.
- Keep administrator bypass explicit and role-based rather than inferring it from trust level.
- Centralize trust decisions and comment-creation rate limiting so current and future comment domains cannot silently diverge.
- Preserve existing target authorization, revalidation, file lifecycle, and owner checks after the trust gate passes.

**Non-Goals:**

- Add a schema migration, a general-purpose rate-limit service, or a client-only permission model.
- Gate arbitrary updates/deletes of trips, photos, or tracks beyond the explicitly scoped creation/upload workflows.
- Implement verified-account quotas, trust promotion, manual trust changes, or user administration.

## Decisions

### Use a shared server-only trust authorization helper

A small server-only helper will resolve session, role, and persisted trust in one place and expose named checks for the gated action categories. Mutations call it before target lookup, file binding, or write work. It distinguishes anonymous authentication failures from insufficient-trust denials, while retaining the existing domain-level authorization checks afterward.

Alternative considered: repeat `getCurrentUserTrust` checks inside every mutation. Rejected because omissions would create uneven enforcement and later comment domains could miss the policy.

### Administrators bypass trust by role, not by stored level

The helper will use the existing role predicate to exempt administrators from the ordinary-user trust gate. Administrator-only actions remain protected by their existing administrator checks; the exemption does not turn ordinary users into administrators.

Alternative considered: automatically treat every administrator as `TRUSTED`. Rejected because it changes persisted policy state and obscures the distinction between role and trust.

### Make comment creation interval atomic per user

The shared comment-creation guard will serialize competing creation attempts for the same user within a database transaction, inspect the user's most recent successful comment across target columns, and only then create the new row. A transaction-scoped PostgreSQL advisory lock keyed by the actor prevents concurrent requests from both passing the timestamp check. No extra rate-limit table is required; failed validation and denied writes never create a timestamped comment and therefore never consume the interval.

Alternative considered: an in-memory timer or client-side disabled button. Rejected because it is ineffective across server instances, tabs, and direct server-action requests. A dedicated rate-limit table is deferred because the existing comment timestamp provides the required durable record for this narrowly scoped rule.

### Gate creations before irreversible file or record work

Trust checks run before file asset eligibility/binding and before creating trips, tracks, photos, likes, or comments. Existing owner checks and visibility checks remain in their present domains. This avoids orphan records or changed relationships when an ineligible user invokes a server action directly.

Alternative considered: hide controls and let writes fail later. Rejected because controls are not an authorization boundary and later failure can occur after avoidable work.

## Risks / Trade-offs

- [A newly added comment domain omits the shared guard] → Require every comment creation route to call the common comment-creation guard and retain the cross-domain spec scenario.
- [Role or trust lookup changes between UI render and submit] → Resolve both on each server mutation; UI messaging is only a convenience.
- [Concurrent requests bypass a read-then-write timestamp check] → Serialize same-user comment creation in the database transaction.
- [Trust gate changes leave unusable controls visible] → Add client-facing disabled or explanatory states only after server enforcement is in place; test direct action calls independently.

## Migration Plan

No schema or data migration is required. Deploy the shared helpers and every scoped mutation gate together. Rollback removes the new gate calls and helper; no persisted trust or comment data needs conversion.
