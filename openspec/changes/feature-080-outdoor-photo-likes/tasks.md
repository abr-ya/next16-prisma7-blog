## 1. Photo-like data foundation

- [ ] 1.1 Add the one-user-per-photo `PhotoLike` Prisma relation, indexes, cascade behavior, and a new forward migration; regenerate the Prisma client without editing generated files.
- [ ] 1.2 Add bounded public-trip photo-like reads that return aggregate counts and only the signed-in viewer's liked state.

## 2. Server-authoritative interaction

- [ ] 2.1 Add authenticated like/unlike actions that verify the current photo is published and linked to the specified published trip before mutation.
- [ ] 2.2 Make duplicate and repeated requests idempotent, revalidate the affected trip path, and return safe user-facing failures without private relationship data.

## 3. Public gallery UI

- [ ] 3.1 Extend public trip gallery item data with the count and viewer state, while keeping anonymous payloads identity-free.
- [ ] 3.2 Render accessible like count and toggle controls on eligible trip photo cards, including an unauthenticated sign-in-required state.
- [ ] 3.3 Preserve existing thumbnail, full-photo viewer, contribution, coordinate-review, and responsive gallery behavior.

## 4. Verification and documentation

- [ ] 4.1 Run Prisma schema/migration validation, `npm run tsc`, and targeted ESLint for all changed non-`app` files.
- [ ] 4.2 Ask for or perform manual browser checks as an anonymous visitor and as a signed-in user: like, unlike, refresh persistence, duplicate-click behavior, and an ineligible photo attempt.
- [ ] 4.3 Ask the user to run `npm run build` locally; record the result and update the OpenSpec checklist, specs, backlog, and history workflow state as appropriate.
