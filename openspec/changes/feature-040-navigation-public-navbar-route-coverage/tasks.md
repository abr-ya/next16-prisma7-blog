## 1. Route Coverage Audit

- [ ] 1.1 Confirm current navbar coverage for `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]`.
- [ ] 1.2 Confirm missing navbar coverage for `/`, `/docs`, `/docs/[slug]`, and `/comments`.
- [ ] 1.3 Choose the narrow public shell or layout placement that excludes `/admin`, `/sign-in`, `/sign-up`, API routes, UploadThing routes, and static internals.

## 2. Public Navbar Shell Implementation

- [ ] 2.1 Add or adjust the public route shell so Home, Docs, Docs detail, and Comments render the shared public navbar.
- [ ] 2.2 Reuse the existing server-side `authSession()` lookup and pass navbar user props consistently.
- [ ] 2.3 Preserve existing Blog and Videos navbar coverage without duplicate navbars.
- [ ] 2.4 Preserve current page content, metadata, public route URLs, and visibility behavior.
- [ ] 2.5 Adjust page spacing only where the new navbar boundary creates obvious layout crowding or duplicate navigation friction.

## 3. Behavior Checks

- [ ] 3.1 Verify visitor navbar behavior on `/`, `/blog`, `/blog/[slug]`, `/docs`, `/docs/[slug]`, `/videos`, `/videos/[id]`, and `/comments`.
- [ ] 3.2 Verify signed-in navbar account behavior on `/`, `/blog`, `/blog/[slug]`, `/docs`, `/docs/[slug]`, `/videos`, `/videos/[id]`, and `/comments`.
- [ ] 3.3 Verify public navbar localization still works on newly covered pages.
- [ ] 3.4 Verify `/admin`, `/sign-in`, and `/sign-up` are not wrapped by the public navbar.

## 4. Documentation And Tracking

- [ ] 4.1 Keep the OpenSpec proposal, design, spec delta, and tasks aligned with implementation choices.
- [ ] 4.2 Update backlog tracking for `public-navbar-route-coverage` promotion to `feature-040-navigation-public-navbar-route-coverage`.

## 5. Validation

- [ ] 5.1 Run `npm run tsc`.
- [ ] 5.2 Run `npm run lint`.
- [ ] 5.3 Run targeted ESLint for changed files outside `app/` when applicable.
- [ ] 5.4 Ask the user to run `npm run build` locally and paste the result before treating routing/user-facing behavior as fully validated.
