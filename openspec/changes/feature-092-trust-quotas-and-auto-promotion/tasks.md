# Tasks

## 1. Trust quota and transition foundation

- [x] 1.1 Add a server-only verified-resource quota helper with exported limits (3 trips, 30 photos, 10 tracks), actor/category advisory locking, and count checks that bypass `TRUSTED` users and administrators; verify boundary and concurrent-create cases do not exceed a limit.
- [x] 1.2 Add an atomic server-only trust-transition helper that conditionally updates a user and writes the matching `TrustChangeLog` row; verify concurrent `VERIFIED` → `TRUSTED` transitions create at most one `AUTO_PROMOTION` audit record.
- [x] 1.3 Add an administrator-only manual trust-level mutation for non-administrator targets (`VERIFIED`, `TRUSTED`, `RESTRICTED`) using the shared transition helper; verify attempts to mutate an administrator are rejected without a write or audit row.
- [x] 1.4 Add a reusable verified-user eligibility reconciliation entry point for future email verification, documented with its required post-verification invocation; verify it never demotes `TRUSTED` users or promotes `RESTRICTED` users.

## 2. Data migration and promotion behavior

- [x] 2.1 Create a new forward Prisma migration that deletes only `PhotoLike` rows where the liker owns the photo, then promotes qualifying `VERIFIED` users and records one `AUTO_PROMOTION` audit row each; verify prior applied migrations are unchanged and the migration is reviewable SQL.
- [x] 2.2 Apply the project Prisma migration flow and regenerate the client; verify the schema/client are valid and qualifying historical non-self likes result in trusted users with matching audit records.
- [x] 2.3 Add the adjustable promotion-threshold constant (initial value 10) and the persisted received-like count/reconciliation logic; verify the tenth non-self like promotes an eligible owner atomically and later unlike does not demote them.

## 3. Enforce resource and like boundaries

- [x] 3.1 Wrap trip creation and track creation in their corresponding quota check plus record creation transaction; verify a verified user is denied at 3 trips or 10 tracks, while trusted and administrator actors retain existing authorized creation flows.
- [x] 3.2 Add the actor-wide photo quota check to public trip-photo contribution while retaining the existing per-trip contribution limit, participant checks, file validation, and revalidation; verify concurrent contributions across trips cannot create more than 30 owned `Photo` records for a verified user.
- [x] 3.3 Update public trip-photo liking to reject self-likes before writing, then perform the like and promotion evaluation atomically for the photo owner; verify another eligible user can still toggle one like and public UI reveals no aggregate count or trust level.
- [x] 3.4 Keep quota and promotion errors scoped to their existing mutations without altering public-read, owner, participant, or trust-gate behavior; verify denied calls create no target record, file association, like, or audit row except the specified successful promotion/manual-change audits.

## 4. Documentation and validation

- [x] 4.1 Mark `feature-092-trust-quotas-and-auto-promotion` In Progress in `openspec/backlog.md` and preserve the four-slice dependency table; verify the backlog states its scope and feature-093 dependency accurately.
- [x] 4.2 Run `npx prisma generate`, `npm run tsc`, `npm run lint`, and targeted ESLint for changed `lib` / `app/_data` files; verify all complete without errors.
- [x] 4.3 Ask the user to run `npm run build` locally and report the result, because the sandbox may not fetch Next/Google resources reliably; record any build issue separately from this change. Local build passed on 2026-10-01.
- [x] 4.4 Perform the minimal browser smoke check: the photo owner cannot add a self-like. Verified by the user on 2026-10-01. Deferred quota, promotion, administrator-bypass, and aggregate-disclosure scenarios are intentionally not required for this change.
