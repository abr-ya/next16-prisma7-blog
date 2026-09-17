## 1. Photo-like data foundation

- [x] 1.1 Add the one-user-per-photo `PhotoLike` Prisma relation, indexes, cascade behavior, and a new forward migration; regenerate the Prisma client without editing generated files.
- [x] 1.2 Update bounded public-trip photo-like reads to return only the signed-in viewer's liked state, with identity-free anonymous payloads.
- [x] 1.3 Add a server-only current-user liked-photo read that returns only currently public eligible photo/trip data for a future private surface.

## 2. Server-authoritative interaction

- [x] 2.1 Add authenticated like/unlike actions that verify the current photo is published and linked to the specified published trip before mutation.
- [x] 2.2 Make duplicate and repeated requests idempotent, revalidate the affected trip path, and return safe user-facing failures without private relationship data.

## 3. Public gallery UI

- [x] 3.1 Remove aggregate like-count data from public trip gallery items while keeping the signed-in viewer state private.
- [x] 3.2 Render an accessible semi-transparent top-right photo-overlay toggle on eligible trip photo cards, including an unauthenticated sign-in-required state.
- [x] 3.3 Preserve existing thumbnail, full-photo viewer, contribution, coordinate-review, and responsive gallery behavior.

## 4. Verification and documentation

- [x] 4.1 Re-run `npm run tsc` and targeted ESLint for changed files.
- [ ] 4.2 Ask for or perform manual browser checks as an anonymous visitor and as a signed-in user: top-right overlay placement, sign-in-required state, like, unlike, refresh persistence, and duplicate-click behavior.
- [ ] 4.3 Ask the user to run `npm run build` locally and record the result.
