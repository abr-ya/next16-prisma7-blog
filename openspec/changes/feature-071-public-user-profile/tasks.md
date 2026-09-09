## 1. Profile data and access

- [ ] 1.1 Add authenticated current-user profile data helpers that return existing identity fields, owned post/trip/track/photo counts, and pending trip invitations without accepting a client-supplied user ID.
- [ ] 1.2 Ensure the existing invitation response flow revalidates `/profile` as well as the compatible invitation route after an accept or decline action.

## 2. Profile experience

- [ ] 2.1 Add the authenticated `/profile` route under the shared public top-navigation layout, with a safe authentication boundary for anonymous requests.
- [ ] 2.2 Build the read-only profile identity section using the current name, email, avatar, and existing name-based fallback, without mutation or upload controls.
- [ ] 2.3 Build the personal-content summary for owned posts, trips, tracks, and photos with counts, applicable links, and explicit zero-record states.
- [ ] 2.4 Render the existing pending trip invitation list and accept/decline controls directly in Profile, preserving `/trips/invitations` as the same compatible inbox experience.

## 3. Navigation and verification

- [ ] 3.1 Add the Profile destination to the signed-in public navigation user menu while retaining dashboard and sign-out controls.
- [ ] 3.2 Run `npm run tsc` and fix profile-related type errors.
- [ ] 3.3 Run targeted ESLint for every changed non-`app` source file and `npm run lint` for applicable route files.
- [ ] 3.4 Ask for a local `npm run build` result and manually verify signed-in Profile data, avatar fallback, empty states, invitation accept/decline, compatible `/trips/invitations`, and anonymous-access handling.
