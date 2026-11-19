# Tasks

## 1. Role rules

- [ ] 1.1 Replace the `MAIN`-only check in `validateRouteCompositionSegments` (`lib/route-composition.ts`) with the role rules: start first, end last, at most one of each, at least one `MAIN`, multiple `MAIN` segments allowed, and a `lapCount` above one only on `MAIN`.
- [ ] 1.2 Keep `validateRouteCompositionMeaning` and the loop-closure rule as they are; a start or an end is a single pass and may be open.
- [ ] 1.3 Add role codes to `RouteRecipeIssue` and keep the messages specific (`START` not first, `END` not last, duplicate role, missing main, connector laps).

## 2. Persistence

- [ ] 2.1 In `lib/route-composition.server.ts`, write the validated `role` into `CompositionSegmentRow` instead of forcing `AUTHORABLE_ROUTE_SEGMENT_ROLE`, and keep defaulting a missing role to `MAIN` in `normalizeSegmentInputs`.
- [ ] 2.2 Confirm `resolveLapVariantRoute` still sends `MAIN` explicitly and `getRouteCompositionSegments` already returns the stored role.
- [ ] 2.3 Confirm the create and replace transactions store the roles they are given.

## 3. Builder

- [ ] 3.1 Add a role selector (**Start**, **Main**, **End**) to each segment row in `components/track-pages/route-composition-dialog.tsx`.
- [ ] 3.2 Pin the lap input to one and disable it when the row is a start or an end; restore editability when it returns to main.
- [ ] 3.3 Send the row's role and position in the payload instead of a hardcoded `MAIN`.
- [ ] 3.4 Load the stored role in edit mode so a lead-in / loop / lead-out recipe reopens correctly.
- [ ] 3.5 Keep the client ready check as it is; role mistakes surface as a server toast with the dialog open.

## 4. Verification

- [ ] 4.1 Add the role cases to `scripts/check-route-composition.ts`: valid start/main/end, start not first, second start, end in the middle, start with two laps, no main segment.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint` and targeted `npx eslint` for the touched `lib` and `components` files.
- [ ] 4.4 Run `npx tsx scripts/check-route-composition.ts` and `npx openspec validate --changes --strict`.
- [ ] 4.5 Run a production build in the sandbox, or ask the owner to run it locally when the sandbox network is restricted.
- [ ] 4.6 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; the slice itself creates no routes.
