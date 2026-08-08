## Context

The accepted auth/roles structure identifies GitHub as a separate follow-up account flow. The current server auth configuration already includes Better Auth social providers for Google and GitHub, and the auth client can start `authClient.signIn.social({ provider: "github" })`. The visible `/sign-in` and `/sign-up` pages still use placeholder form content inside a shared `AuthCard`, so the user-facing GitHub flow is not yet polished or documented as a completed slice.

Role storage is already implemented with ordinary `user` defaults and explicit admin promotion. This GitHub feature must preserve that boundary: GitHub authenticates identity but never grants elevated authorization by provider alone.

## Goals / Non-Goals

**Goals:**

- Provide a clear GitHub sign-in/sign-up entry point on the existing auth pages.
- Start the Better Auth GitHub social flow from client UI and return users to a predictable callback destination.
- Show loading and failure states for GitHub auth initiation.
- Keep GitHub provider configuration server-owned and fail gracefully when required environment variables are missing.
- Document and enforce that GitHub-created users receive the ordinary `user` role.
- Define account-linking boundaries for email conflicts without adding a full account settings UI.

**Non-Goals:**

- Do not implement email/password forms, email verification, or password reset.
- Do not implement GitHub account unlinking, manual linking from profile settings, or multi-provider account management UI.
- Do not change the Google provider flow except to preserve existing behavior.
- Do not add role assignment, user management, or admin account controls.
- Do not add a custom OAuth implementation outside Better Auth.

## Decisions

1. Keep Better Auth as the OAuth implementation.

   The current stack already uses Better Auth with a Prisma adapter and social provider support. This feature should improve the app integration around that provider instead of adding custom OAuth routes. Alternative considered: a custom GitHub OAuth route; rejected because it would duplicate Better Auth's account/session storage.

2. Treat `/sign-in` and `/sign-up` as two entry points to the same GitHub social flow.

   GitHub OAuth may create a user or sign in an existing account depending on Better Auth's provider/account data. The UI can label the action according to the current page, but the underlying client call can use the same Better Auth social sign-in API. Alternative considered: separate custom sign-up and sign-in handlers; rejected because the provider flow decides based on account state.

3. Return successful GitHub auth to `/admin`.

   This app treats `/admin` as the authenticated creator workspace. Returning there after auth makes the first useful post-login destination explicit. Alternative considered: returning to `/`; rejected because signing in is primarily useful for content/admin workflows in this project.

4. Keep authorization separate from provider identity.

   GitHub-created users should rely on the existing persisted role defaults. A GitHub account or GitHub email must not imply `admin`. Alternative considered: granting privileges for particular GitHub organizations or usernames; rejected as out of scope and contrary to the accepted role source-of-truth.

5. Do not auto-link ambiguous same-email accounts in app code.

   If Better Auth cannot safely link a GitHub account to an existing user, the UI should surface a clear failure and point users to another sign-in path or a future account-management flow. Alternative considered: manually merging accounts by email in this slice; rejected because it can create account-takeover risk and belongs in a dedicated account-linking design.

6. Make missing provider configuration visible without leaking secrets.

   Server configuration should not expose secrets to the client. If GitHub OAuth cannot be started because required server env values are absent or invalid, users should see a generic actionable error while logs/configuration remain server-side.

## Risks / Trade-offs

- GitHub provider behavior depends on environment configuration -> Validate with local/dev env and keep user-facing errors generic.
- Same-email account linking can be security-sensitive -> Avoid custom merging and defer explicit linking UX.
- OAuth callback behavior is hard to fully validate in sandbox -> Use static checks here and require local browser validation with configured GitHub credentials.
- Sign-in/sign-up pages still need email/password polish later -> Keep placeholder email/password scope out of this GitHub slice and leave `feature-062-email-password-account-flow` parked.
