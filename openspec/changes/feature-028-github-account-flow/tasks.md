## 1. Auth Flow Boundary

- [x] 1.1 Review Better Auth GitHub provider configuration and confirm required server env variables.
- [x] 1.2 Keep GitHub OAuth implemented through Better Auth rather than adding custom OAuth routes.
- [x] 1.3 Set the GitHub social auth callback destination to `/admin`.

## 2. Auth Page UI

- [x] 2.1 Replace placeholder sign-in content with a usable GitHub authentication entry point and existing page-switch link.
- [x] 2.2 Replace placeholder sign-up content with a usable GitHub authentication entry point and existing page-switch link.
- [x] 2.3 Add pending and error states for GitHub auth initiation.
- [x] 2.4 Preserve the current Google provider action unless implementation requires isolating it from GitHub-specific changes.

## 3. Role and Linking Boundaries

- [x] 3.1 Confirm GitHub-created users continue to receive the ordinary `user` role by default.
- [x] 3.2 Avoid custom same-email account merging or manual provider linking in this slice.
- [x] 3.3 Surface recoverable UI copy for GitHub auth failures without exposing provider secrets.

## 4. Validation

- [x] 4.1 Run targeted ESLint for changed non-app files.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run `npm run lint`.
- [x] 4.4 Validate local `npm run build`.
- [x] 4.5 Defer GitHub OAuth credential creation and live browser callback verification to `feature-063-github-oauth-credentials-validation`.
