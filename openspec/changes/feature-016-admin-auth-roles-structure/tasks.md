## 1. Current Auth Inventory

- [x] 1.1 Document the current better-auth configuration in `lib/auth.ts`.
- [x] 1.2 Document the current sign-in, sign-up, and auth API routes.
- [x] 1.3 Document that better-auth stores users in the project PostgreSQL database through the Prisma adapter.
- [x] 1.4 Document the current Prisma auth models and confirm `User` has no role field.
- [x] 1.5 Document that `/admin` is currently protected by session presence through `requireAuth()`.

## 2. Role and Registration Decisions

- [x] 2.1 Define the initial role vocabulary for administrators and ordinary authenticated creators.
- [x] 2.2 Confirm the existing Prisma `User` model is the persisted source of truth for first-party roles.
- [x] 2.3 Decide whether the first role implementation should adopt better-auth Admin plugin role conventions.
- [x] 2.4 Plan `editor` as a deferred content-moderation role without system controls.
- [x] 2.5 Define which `/admin` surfaces stay available to all authenticated users as creator-owned workspace features.
- [x] 2.6 Define which sensitive operations require an administrator role.
- [x] 2.7 Decide how existing users should be defaulted or backfilled when roles are implemented.
- [x] 2.8 Decide how the first administrator should be assigned manually.
- [x] 2.9 Decide whether public self-registration remains open with ordinary user defaults, becomes invite-only, or uses another policy.
- [x] 2.10 Decide whether email verification is required before administrator access.
- [x] 2.11 Decide whether Google and GitHub remain enabled long-term.

## 3. Follow-up Slicing

- [x] 3.1 Define `feature-017-auth-admin-plugin-role-storage` for Better Auth Admin plugin evaluation/installation, the Prisma user role field, safe defaults, manual first-admin promotion, and minimal role helpers.
- [x] 3.2 Define a sensitive-operation gating slice for `requireAdmin()` and administrator-only page/action enforcement.
- [x] 3.3 Define an optional follow-up slice for the deferred `editor` role.
- [x] 3.4 Define `feature-027-email-password-account-flow` for form-based account creation/login, mailbox-backed email verification, and password reset boundaries.
- [x] 3.5 Define `feature-028-github-account-flow` for GitHub account creation/login, callback behavior, email availability, and account-linking boundaries.
- [x] 3.6 Define optional follow-up slices for invite flow, account settings, Google provider review, and provider/account cleanup.
- [x] 3.7 Confirm UploadThing site settings and sensitive file dashboards depend on role-gated admin access.

## 4. Validation and Closeout

- [x] 4.1 Run `openspec validate feature-016-admin-auth-roles-structure --strict`.
- [x] 4.2 Run `openspec status --change feature-016-admin-auth-roles-structure`.
- [ ] 4.3 Sync accepted specs before archive after review approval.
- [ ] 4.4 Update `openspec/backlog.md` to `Done` only after accepted-spec sync and archive.
- [x] 4.5 Run `git diff --check` after final OpenSpec edits.
