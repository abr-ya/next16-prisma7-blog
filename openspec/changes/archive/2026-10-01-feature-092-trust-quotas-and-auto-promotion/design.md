# Design

## Context

See [proposal.md](proposal.md) for motivation and the delta specs for the behavior contract. Feature-090 already persists `User.trustLevel`, has the `TrustChangeLog` audit model and the `AUTO_PROMOTION` / `ADMIN_MANUAL` sources, while feature-091 centralizes the current session, role, and trust gate in `requireTrustGatedAction`. Trip creation (`createHike`), track creation (`createTrack`), and public trip-photo contribution (`contributePhotoToHike`) are separate server mutations. `PhotoLike` has one row per `(photoId, userId)` and a cascade relation to its photo and user.

There is no soft delete for Hike, Track, or Photo, so a live resource is an extant record owned by the actor. The current email/password setup has no shipped email-verification lifecycle mutation; its later feature must call the reusable eligibility reconciliation created here when it changes a user from `NEW` to `VERIFIED`.

## Goals / Non-Goals

**Goals:**

- Make verified-account counts race-safe across every in-scope creation path without changing existing trust, owner, participant, file, or visibility checks.
- Make self-like removal and qualifying historical promotion an auditable, forward-only migration.
- Keep promotion and manual changes in one trust-transition helper so updates and audit rows cannot diverge.
- Leave feature-093 with an administrator-only mutation it can bind to UI rather than embedding access policy in a table component.

**Non-Goals:**

- Add user administration UI, quota dashboards, public counts, or notification emails.
- Make unlikes demote accounts or change the current `NEW`/`RESTRICTED` gates.
- Build the missing email-verification UX; this slice exposes its required reconciliation boundary only.

## Decisions

### Count extant owned rows and serialize each quota category per actor

The quota helper will receive the already-resolved gated user and a resource category, skip administrators and non-`VERIFIED` levels, and count `Hike`, `Photo`, or `Track` rows by `userId`. Each create flow will execute the check and insert inside the same database transaction under a transaction-scoped PostgreSQL advisory lock keyed by actor and resource category.

This preserves the existing `contributePhotoToHike` per-trip lock while adding an actor-wide photo-quota lock so simultaneous contributions to different trips cannot exceed 30. Hike and track creation will receive equivalent short transactions. Deleting a row needs no special quota bookkeeping because the next count naturally sees the freed slot.

Alternative considered: add denormalized counters to `User`. Rejected because it requires schema changes, deletion synchronization, reconciliation, and a more failure-prone consistency model for three small tables.

### Perform every trust transition with an atomic compare-and-write helper

A server-only helper will update `User.trustLevel` only when its expected old value matches, and create the paired `TrustChangeLog` entry in the same transaction. Automatic promotion uses an expected `VERIFIED` value, so concurrent threshold crossings can create at most one audit row. The administrator mutation resolves the actor's role, resolves the target role, rejects administrator targets, and uses the same helper with `ADMIN_MANUAL`.

Alternative considered: update the user then write the audit log in separate queries. Rejected because a crash between them violates the audit guarantee.

### Promote after a successful non-self like using the photo owner as the locked subject

The like mutation will load the eligible published photo and its owner, reject `ownerId === viewerId`, then run its upsert under a transaction-scoped lock for the owner. In that same transaction it will count persisted non-self likes on the owner's photos; when the count reaches the configurable threshold, it invokes the guarded trust-transition helper. The count intentionally follows persisted `PhotoLike` rows rather than public rendering state, preserving earned status when a photo later becomes unavailable.

Alternative considered: promote asynchronously from a scheduled job. Rejected because the product requires promotion immediately in the like action and a job would introduce latency and deployment infrastructure.

### Use one forward migration for legacy self-like cleanup and rollout reconciliation

A new immutable Prisma migration will first delete `PhotoLike` rows whose liker is the photo owner. It will then identify `VERIFIED` users whose remaining received-like total is at least the configured threshold, change them to `TRUSTED`, and insert one `AUTO_PROMOTION` audit row per changed user in the same migration transaction. The SQL must be safe for the migration's single application and must not alter prior migrations.

The runtime eligibility helper will be reusable by the future email-verification flow. That future flow calls it only after it durably changes a user to `VERIFIED`; it cannot lower a manually trusted user because the promotion helper only performs the `VERIFIED` to `TRUSTED` transition.

Alternative considered: perform the rollout scan in an untracked script. Rejected because it can be skipped in deployment and does not give the migration history an auditable, reproducible data transformation.

## Risks / Trade-offs

- [Creation races overshoot a quota] → use a transaction-scoped advisory lock keyed by actor and category before counting and inserting.
- [The existing per-trip photo limit interacts unexpectedly with the new account-wide limit] → preserve both checks and return the first applicable server error; test each boundary independently.
- [Legacy self-likes inflate promotion] → delete them before reconciliation and block new self-likes before a new like is written.
- [A future verification flow forgets eligibility reconciliation] → export a narrowly named server helper and record its required call in the email-password feature's dependency notes.
- [Manual action changes an admin's state] → load the persisted target role server-side and reject all administrator targets regardless of client input.
- [Public UI leaks reputation information] → do not add aggregate read fields or UI props; keep errors mutation-scoped and existing likes private.

## Migration Plan

1. Add a new forward Prisma migration that removes only historical self-like rows, promotes only qualifying `VERIFIED` users, and writes the matching `AUTO_PROMOTION` audit records.
2. Regenerate the Prisma client through the project flow; no generated files are edited manually.
3. Deploy the server helpers and mutation changes together, then run type and lint checks plus focused quota/promotion checks.
4. Rollback code can stop future quota checks and promotion attempts, but the cleanup and promotions are deliberately preserved data changes; do not edit or roll back an applied migration. A later audited administrator action can change an account level if needed.

## Open Questions

None. The initial threshold is fixed at an exported adjustable constant of 10; choosing a configurable administrator setting is outside this slice.
