## 1. Auth Flow Boundary

- [ ] 1.1 Review Better Auth GitHub provider configuration and confirm required server env variables.
- [ ] 1.2 Keep GitHub OAuth implemented through Better Auth rather than adding custom OAuth routes.
- [ ] 1.3 Set the GitHub social auth callback destination to `/admin`.

## 2. Auth Page UI

- [ ] 2.1 Replace placeholder sign-in content with a usable GitHub authentication entry point and existing page-switch link.
- [ ] 2.2 Replace placeholder sign-up content with a usable GitHub authentication entry point and existing page-switch link.
- [ ] 2.3 Add pending and error states for GitHub auth initiation.
- [ ] 2.4 Preserve the current Google provider action unless implementation requires isolating it from GitHub-specific changes.

## 3. Role and Linking Boundaries

- [ ] 3.1 Confirm GitHub-created users continue to receive the ordinary `user` role by default.
- [ ] 3.2 Avoid custom same-email account merging or manual provider linking in this slice.
- [ ] 3.3 Surface recoverable UI copy for GitHub auth failures without exposing provider secrets.

## 4. Validation

- [ ] 4.1 Run targeted ESLint for changed non-app files.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint`.
- [ ] 4.4 Ask for local `npm run build` validation if routing or auth runtime behavior needs sandbox-independent confirmation.
- [ ] 4.5 Manually verify `/sign-in` and `/sign-up` with configured GitHub OAuth credentials in the browser.
