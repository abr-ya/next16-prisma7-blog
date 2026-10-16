# Tasks

## 1. Spec / change setup

- [x] 1.1 Confirm the `outdoor-hike-media-map` capability path and the target requirements (per `proposal.md` § Capabilities and `design.md` § Data flow)
- [x] 1.2 Re-read the existing `getPublicHikeBySlug`, `publicHikeInclude`, and `TripPage` callsites to confirm the design's data flow matches the current code (no drift since the proposal was written)

## 2. Data layer: parameterized include

- [x] 2.1 Convert `publicHikeInclude` in `app/_data/hikes/types.ts` from a `Prisma.HikeInclude` constant to a factory `publicHikeInclude({ includeCreatorDrafts: boolean }): Prisma.HikeInclude` that returns the same shape, but the `tracks.where` becomes `OR: [{ track: { status: "PUBLISHED" } }, { track: { status: "DRAFT", userId: hikeUserId } }]` when `includeCreatorDrafts` is `true` and the original `status: "PUBLISHED"` filter otherwise
- [x] 2.2 Add a typed parameter to the factory so the `userId` is passed alongside the boolean (avoids re-deriving the trip's `userId` inside the include). Keep the existing `Prisma.HikeInclude` return type so `PublicHike` inference is unchanged
- [x] 2.3 Update `getPublicHikeBySlug` in `app/_data/hikes/queries.ts` to accept `{ includeCreatorDrafts: boolean; hikeUserId: string }` (or equivalent positional args) and pass them through to the factory
- [x] 2.4 Make sure the existing `getPublicHikes` and any other callers of the old constant (search before changing) keep working — either by exporting a default `publicHikeInclude` constant that delegates to the factory with `includeCreatorDrafts: false`, or by updating each caller explicitly

## 3. Trip page wiring

- [x] 3.1 In `TripPage` (`app/(public)/hikes/[slug]/page.tsx`), resolve `isCreator` (`hike.userId === session?.user.id`) and `isAdmin` (reusing the same `currentUserRole()` + `hasAdminRole(role)` check the existing capability helper uses, or reusing the helper's return value if it surfaces those booleans)
- [x] 3.2 Compute `canSeeCreatorDrafts = isCreator || isAdmin` and pass it (with `hike.userId`) into `getPublicHikeBySlug`
- [x] 3.3 Confirm the existing `Promise.all` for `authSession`, `getHikeTrackContributionCapability`, etc. already loads everything we need; add a single call to `currentUserRole()` only if it isn't already loaded by the capability helper's internals (avoid double-querying)
- [x] 3.4 Sanity-check: the same `isCreator || isAdmin` is used for the `Add track` button — make sure the two paths cannot disagree

## 4. UI: linked-track card list

- [ ] 4.1 In `components/hike-pages/hike-trip-media.tsx`, import `useT(tripsNamespace)` (or use the existing localizer pattern in this file) and add a `Badge` rendering branch when `track.status === "DRAFT"` that reads `t("linkedTrackDraftBadge")`
- [ ] 4.2 Add a muted wrapper class (e.g. `opacity-80` or a softer border color) on the card when `track.status === "DRAFT"` so the row is visually distinct from `PUBLISHED`
- [ ] 4.3 Confirm the link to `/tracks/[slug]` stays — the public track detail page's own per-track visibility rules protect against the owner being denied access to their own draft

## 5. UI: trip map

- [ ] 5.1 In `components/hike-pages/hike-trip-media.tsx`, branch on `track.status` when rendering the polyline: `PUBLISHED` keeps the existing teal `TRACK_LINE_COLORS[0]` solid stroke; `DRAFT` renders with a muted color (e.g. `#94a3b8` slate-400), `weight: 2`, and `dashArray: "4 6"`
- [ ] 5.2 Apply the same muted treatment to the endpoint markers for DRAFT tracks so the map clearly distinguishes "preview" from "real"
- [ ] 5.3 Re-verify the day-filter (`selectedDay === ALL_DAYS ? linkedTracks : linkedTracks.filter(...)`) still works for DRAFT tracks and that `hasMap` (line 89) still includes DRAFT tracks whose `track.map` is populated

## 6. Localization

- [ ] 6.1 Add `"linkedTrackDraftBadge": "Draft"` to `app/i18n/locales/en/trips.json`
- [ ] 6.2 Add `"linkedTrackDraftBadge": "Черновик"` to `app/i18n/locales/ru/trips.json`
- [ ] 6.3 Search the rest of `trips.json` to confirm `"Draft"` / `"Черновик"` are not already used as a different key in a conflicting meaning; if they are, choose a key name that is unambiguous

## 7. Validation

- [ ] 7.1 Run `npm run tsc` — no new type errors
- [ ] 7.2 Run `npm run lint` (or targeted `npx eslint <path>` for non-`app/` files) — clean
- [ ] 7.3 Run `npm run build` to confirm the production build is green
- [ ] 7.4 Run `openspec validate --specs --change feature-115-outdoor-trip-owner-draft-track-visibility` and `openspec validate --change feature-115-outdoor-trip-owner-draft-track-visibility` — both green
- [ ] 7.5 Manually verify in the browser:
  - As the trip owner, open `/trips/[slug]` of a trip you own that has a DRAFT track you attached — confirm the row is in the linked-track list with the `Draft` badge and muted style, and the polyline is on the map
  - As an anonymous viewer, open the same URL — confirm the DRAFT row is gone
  - As a non-owner signed-in user (e.g. a participant or a separate test account), open the same URL — confirm the DRAFT row is gone
  - As an administrator viewing a trip they did NOT create that has the owner's DRAFT tracks — confirm the DRAFT row IS visible (per the design)
  - As the trip owner, follow the link from the DRAFT row to `/tracks/[slug]` — confirm the per-track download rules still apply (no direct GPX URL exposed)
