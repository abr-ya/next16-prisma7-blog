## 1. Data model and authorization foundation

- [ ] 1.1 Add the additive invitation/membership status enum and trip-user relation to the Prisma schema, with uniqueness, indexes, and cascade behavior that preserve existing trip/user/media data.
- [ ] 1.2 Create and review the Prisma migration, then regenerate the Prisma client through the existing project flow.
- [ ] 1.3 Add narrow trip participant/invitation types and server helpers for accepted membership and owner/admin authorization.

## 2. Invitation lifecycle

- [ ] 2.1 Implement authorized server actions to invite an existing user by normalized email, including neutral validation for unknown, owner, duplicate-pending, and already-accepted accounts.
- [ ] 2.2 Implement recipient-only accept/decline actions and owner/admin cancel/remove actions, with visibility-safe path revalidation.
- [ ] 2.3 Extend private trip data reads with the minimal manager and recipient projections, while keeping invitation/member data out of public trip reads.

## 3. Authenticated trip UI

- [ ] 3.1 Add owner/admin participation controls to the trip detail experience for inviting by email, reviewing pending/accepted state, cancelling invitations, and removing participants.
- [ ] 3.2 Add the authenticated `/trips/invitations` inbox with accept/decline controls and an appropriate empty state.
- [ ] 3.3 Confirm anonymous, non-owner, and non-admin UI paths do not expose private participation controls or data.

## 4. Documentation and validation

- [ ] 4.1 Keep the outdoor roadmap and implementation notes aligned with invitation-backed membership and the deferred public-avatar follow-up.
- [ ] 4.2 Run `openspec validate feature-070-outdoor-trip-participants --strict`.
- [ ] 4.3 Run `npm run tsc` and targeted ESLint for every changed non-`app` TypeScript/TSX file; run `npm run lint` for changed `app` files.
- [ ] 4.4 Ask for a local `npm run build` and manual browser verification of invitation, accept/decline, cancellation/removal, and unauthorized-access paths; record the result.
