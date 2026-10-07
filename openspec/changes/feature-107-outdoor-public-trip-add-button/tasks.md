# Tasks

## 1. Creation capability and shared trip form

- [ ] 1.1 Add a server-derived public trip-creation capability that distinguishes eligibility, sign-in, insufficient-trust, and verified-quota reasons without exposing raw trust or quota data; verify the existing `createHike` mutation remains the final trust/quota/ownership authority.
- [ ] 1.2 Extract the existing trip schema, defaults, slug-generation behavior, and title/slug/description/date/type/status fields into `components/forms/trips/`; verify administrator create/edit accepts the same valid and invalid values as before.
- [ ] 1.3 Extract a reusable trip dialog into `components/dialogs/trips/` and adapt the administrator panel without moving its table, association, participant, note, or cross-user-management orchestration; verify administrator create/edit continues to work.

## 2. Public Trips creation entry point

- [ ] 2.1 Add an always-visible public `/trips` `Add Trip` control backed by the capability; verify disabled controls render adjacent localized feedback for anonymous, insufficient-trust, and verified-quota states.
- [ ] 2.2 Add the eligible public creation-dialog flow using the shared full trip form and existing creation mutation; verify Published success navigates to `/trips/[slug]`, Draft success navigates to `/admin/trips`, and server errors leave no partial trip.
- [ ] 2.3 Add EN/RU Trips resources for the new public action, disabled explanations, dialog, and feedback with English fallback; verify no administrator-only labels or controls leak onto the public page.

## 3. Validation and workflow records

- [ ] 3.1 Run `npm run tsc` and targeted ESLint for every changed TypeScript/TSX file; verify both exit successfully.
- [ ] 3.2 Ask the user to run `npm run build` locally and report the result, because sandbox builds may fail while fetching external fonts; record the result in the change handoff.
- [ ] 3.3 Manually verify `/trips` as anonymous, `NEW`/`RESTRICTED`, quota-reached `VERIFIED`, eligible `VERIFIED` or `TRUSTED`, and administrator: disabled feedback, dialog fields, Draft/Published destinations, admin form regression, and direct server denial after stale eligibility.
- [ ] 3.4 Keep `openspec/backlog.md` and this checklist current; retain `outdoor-my-trips-page` and `shared-cross-surface-forms-dialogs` as separate follow-ups.
