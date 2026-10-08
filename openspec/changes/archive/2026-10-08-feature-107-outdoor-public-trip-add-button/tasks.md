# Tasks

## 1. Creation capability and shared trip form

- [x] 1.1 Add a server-derived public trip-creation capability that distinguishes eligibility, sign-in, insufficient-trust, and verified-quota reasons without exposing raw trust or quota data; verify the existing `createHike` mutation remains the final trust/quota/ownership authority.
- [x] 1.2 Extract the existing trip schema, defaults, slug-generation behavior, and title/slug/description/date/type/status fields into `components/forms/trips/`; verify administrator create/edit accepts the same valid and invalid values as before.
- [x] 1.3 Extract a reusable trip dialog into `components/dialogs/trips/` and adapt the administrator panel without moving its table, association, participant, note, or cross-user-management orchestration; verify administrator create/edit continues to work.

## 2. Public Trips creation entry point

- [x] 2.1 Add an always-visible public `/trips` `Add Trip` control backed by the capability; verify disabled controls render adjacent localized feedback for anonymous, insufficient-trust, and verified-quota states.
- [x] 2.2 Add the eligible public creation-dialog flow using the shared full trip form and existing creation mutation; verify Published success navigates to `/trips/[slug]`, Draft success navigates to `/admin/trips`, and server errors leave no partial trip.
- [x] 2.3 Add EN/RU Trips resources for the new public action, disabled explanations, dialog, and feedback with English fallback; verify no administrator-only labels or controls leak onto the public page.

## 3. Validation and workflow records

- [x] 3.1 Run `npm run tsc` and targeted ESLint for every changed TypeScript/TSX file; verify both exit successfully.
- [x] 3.2 User ran `npm run build` locally on 2026-10-08; build passed.
- [ ] 3.3 Manual `/trips` role-matrix verification (anonymous, `NEW`/`RESTRICTED`, quota-reached `VERIFIED`, eligible `VERIFIED` or `TRUSTED`, administrator) — **deferred** to post-merge follow-up to prioritize feature-108 timezone work; tracked under candidate `outdoor-public-trip-add-button-manual-qa` in `openspec/backlog.md`.
- [x] 3.4 Keep `openspec/backlog.md` and this checklist current; retain `outdoor-my-trips-page` and `shared-cross-surface-forms-dialogs` as separate follow-ups.
