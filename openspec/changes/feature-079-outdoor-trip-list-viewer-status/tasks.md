## 1. Viewer relationship data

- [ ] 1.1 Extend the published trip listing read to resolve the current session and return only the current viewer's `creator`, accepted-active `participant`, or `viewer` relationship for each published trip without changing public trip eligibility.
- [ ] 1.2 Confirm the listing projection excludes other users' invitation and membership data and treats pending, declined, removed, and expired invitations as `viewer`.

## 2. Public trip-card labels

- [ ] 2.1 Render one compact relationship badge on every `/trips` card: `My trip`, `Participant`, or `Public trip`.
- [ ] 2.2 Preserve existing trip type/date badges, card navigation, responsive layout, and anonymous access.

## 3. Verification and documentation

- [ ] 3.1 Run `npm run tsc` and targeted ESLint for the changed public route/data files.
- [ ] 3.2 Ask for or perform local browser checks as an anonymous visitor, trip owner, accepted participant, and unrelated signed-in user; include a pending or expired invitation case when suitable data exists.
- [ ] 3.3 Ask the user to run `npm run build` locally and record the result, then update the feature checklist and backlog/history workflow state as appropriate.
