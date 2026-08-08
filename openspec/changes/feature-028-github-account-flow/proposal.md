## Why

Users should be able to create an account and sign in with GitHub through a clear first-party UI flow instead of relying on placeholder auth forms. GitHub is already configured as a Better Auth social provider, so this slice should finish the visible GitHub path and document the account-linking and email-boundary behavior before broader account-management work.

## What Changes

- Rename the near-term backlog item from `feature-030-github-account-flow` to `feature-028-github-account-flow`.
- Add a GitHub sign-in/sign-up flow from the existing `/sign-in` and `/sign-up` pages.
- Keep the callback target predictable after successful GitHub auth.
- Surface actionable UI states for starting GitHub auth and for provider/configuration failures.
- Preserve the existing role model: GitHub users receive the ordinary `user` role by default and GitHub does not imply admin access.
- Define account-linking boundaries for matching or already-used email addresses without adding full account-management UI.

Non-goals:

- No email/password registration, email verification, or password reset implementation.
- No Google account-flow polish beyond preserving the current Google provider button behavior.
- No admin user-management UI, role assignment UI, ban/impersonation UI, or account settings page.
- No new auth database schema unless implementation proves the existing Better Auth schema is insufficient.
- No custom OAuth provider implementation outside Better Auth.

## Capabilities

### New Capabilities

- `github-account-flow`: Covers GitHub account creation/sign-in UI, callback behavior, provider configuration boundaries, ordinary-role defaults, and account-linking behavior.

### Modified Capabilities

- None.

## Impact

- Affected routes and surfaces: `/sign-in`, `/sign-up`, and the existing Better Auth API route at `/api/auth/[...all]`.
- Affected code areas: `components/auth-forms/*`, `lib/auth.ts`, `lib/auth-client.ts`, and any small auth helper/UI components needed for GitHub-specific states.
- Affected data models: existing Better Auth `User`, `Account`, `Session`, and role fields; no migration expected unless validation finds a missing provider/account field.
- Admin/public impact: public auth pages change; admin access remains governed by the existing authenticated workspace and persisted role helpers.
- Dependencies: no new dependency expected.
