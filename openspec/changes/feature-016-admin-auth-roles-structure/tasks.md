## 1. Current Auth Inventory

- [ ] 1.1 Document the current better-auth configuration in `lib/auth.ts`.
- [ ] 1.2 Document the current sign-in, sign-up, and auth API routes.
- [ ] 1.3 Document the current Prisma auth models and confirm `User` has no role field.
- [ ] 1.4 Document that `/admin` is currently protected by session presence through `requireAuth()`.

## 2. Role and Registration Decisions

- [ ] 2.1 Define the initial role vocabulary for administrators and ordinary authenticated creators.
- [ ] 2.2 Define which `/admin` surfaces stay available to all authenticated users as creator-owned workspace features.
- [ ] 2.3 Define which sensitive operations require an administrator role.
- [ ] 2.4 Decide how existing users should be defaulted or backfilled when roles are implemented.
- [ ] 2.5 Decide whether public self-registration remains open with ordinary user defaults, becomes invite-only, or uses another policy.
- [ ] 2.6 Decide whether email verification is required before administrator access.
- [ ] 2.7 Decide whether Google and GitHub remain enabled long-term.

## 3. Follow-up Slicing

- [ ] 3.1 Define a role-storage implementation slice for the Prisma user role field and safe defaults.
- [ ] 3.2 Define a sensitive-operation gating slice for `requireAdmin()` and administrator-only page/action enforcement.
- [ ] 3.3 Define optional follow-up slices for invite flow, password reset, email verification, account settings, and provider/account cleanup.
- [ ] 3.4 Confirm UploadThing site settings and sensitive file dashboards depend on role-gated admin access.

## 4. Validation and Closeout

- [ ] 4.1 Run `openspec validate feature-016-admin-auth-roles-structure --strict`.
- [ ] 4.2 Run `openspec status --change feature-016-admin-auth-roles-structure`.
- [ ] 4.3 Sync accepted specs before archive after review approval.
- [ ] 4.4 Update `openspec/backlog.md` to `Done` only after accepted-spec sync and archive.
- [ ] 4.5 Run `git diff --check` after final OpenSpec edits.
