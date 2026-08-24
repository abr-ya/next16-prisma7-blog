## 1. Route Coverage Inventory

- [ ] 1.1 Confirm current navbar coverage for `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]`.
- [ ] 1.2 Confirm missing navbar coverage for `/`, `/docs`, `/docs/[slug]`, and `/comments`.
- [ ] 1.3 Create a public navigation route coverage inventory document that records current coverage, intended coverage, this-slice coverage, and deferred rollout routes.
- [ ] 1.4 Confirm the inventory excludes `/admin`, `/sign-in`, `/sign-up`, API routes, UploadThing routes, file delivery routes, and static internals.

## 2. Shared Shell Implementation

- [ ] 2.1 Add a reusable server-side public navbar shell or wrapper that renders the existing shared `Navbar`.
- [ ] 2.2 Reuse the existing server-side `authSession()` lookup and pass navbar user props consistently.
- [ ] 2.3 Keep the shell route-agnostic so future slices can apply it to Home, Comments, Blog, and Videos without duplicating session wiring.
- [ ] 2.4 Preserve existing Blog and Videos navbar coverage without duplicate navbars.

## 3. Docs Pilot

- [ ] 3.1 Mount the shared public navbar shell on `/docs`.
- [ ] 3.2 Mount the shared public navbar shell on `/docs/[slug]`.
- [ ] 3.3 Preserve Docs listing/detail content, metadata, public route URLs, slugs, and visibility behavior.
- [ ] 3.4 Adjust Docs page spacing only where the new navbar boundary creates obvious layout crowding or duplicate navigation friction.

## 4. Behavior Checks

- [ ] 4.1 Verify visitor navbar behavior on `/docs` and `/docs/[slug]`.
- [ ] 4.2 Verify signed-in navbar account behavior on `/docs` and `/docs/[slug]`.
- [ ] 4.3 Verify public navbar localization still works on Docs listing/detail pages.
- [ ] 4.4 Verify `/blog`, `/blog/[slug]`, `/videos`, and `/videos/[id]` still have exactly one navbar.
- [ ] 4.5 Verify `/`, `/comments`, `/admin`, `/sign-in`, and `/sign-up` are not newly wrapped by this slice.

## 5. Documentation And Tracking

- [ ] 5.1 Keep the OpenSpec proposal, design, spec delta, and tasks aligned with implementation choices.
- [ ] 5.2 Update backlog tracking so the remaining full public navbar rollout is represented as a separate follow-up candidate.

## 6. Validation

- [ ] 6.1 Run `npm run tsc`.
- [ ] 6.2 Run `npm run lint`.
- [ ] 6.3 Run targeted ESLint for changed files outside `app/` when applicable.
- [ ] 6.4 Ask the user to run `npm run build` locally and paste the result before treating routing/user-facing behavior as fully validated.
