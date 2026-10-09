# Outdoor trip-side track contribution — 2026-10-09

## Context

Follow-up to [outdoor-tracks-feature-research-2026-10-07.md](./outdoor-tracks-feature-research-2026-10-07.md).
Feature-110 implementation notes for the trip-side `Add track` affordance on the public trip detail page.

Goal: capture the implementation-level decisions that were made in-flight so future slices
(detach, map-placement, admin override, multi-track-attach) can ground themselves in the
shipped state without re-discovering the same constraints.

Produced by: feature-110 implementation session.
Project branch at implementation: `feature-110-outdoor-hike-owner-track-upload`.
Project root: `/home/user/full2026/next16-prisma7-blog`.

---

## 1. What shipped

- `components/track-pages/track-gpx-upload-section.tsx` — minimal shared client component
  that owns the `UploadDropzone`, success/error toasts, and emits `onUploadComplete` /
  `onUploadError` to the parent. Parent owns form state, dirty-close guard, and any
  parse-GPX affordance.
- `components/admin-pages/tracks-admin-panel.tsx` — `TrackFormDialog` refactored to
  consume the shared section. The parse-GPX card, read-only file display, and dirty-close
  `Dialog` stay in the parent.
- `app/_actions/files.ts` — `markDiscardedTrackGpxFileAssetsPendingDelete` relaxed from
  an unconditional `requireAdmin()` gate to an actor-aware check. The admin path keeps
  full access; the owner path requires `ownerUserId === actor.id`, `purpose: "TRACK_GPX"`,
  `status: "ACTIVE"`, and `track === null`.
- `app/_data/hikes/mutations.ts`:
  - `attachCreatorTrackToHike({ hikeId, trackId })` — creator-only attach that calls
    `requireTrustGatedAction("track-upload")`, validates `hike.userId === actor.id` and
    `track.userId === actor.id`, then upserts the `HikesToTracks` row. The existing
    admin-only `attachTrackToHike` is unchanged (still used by the admin `HikeTracksDialog`).
  - `createTrackAndAttachToHike(input)` — combined upload+attach in a single
    `prisma.$transaction`. Validates trip ownership (creator only, no admin override in
    this slice), enforces the `track-upload` trust gate and the verified-track quota
    (`assertVerifiedResourceQuota(tx, user, "track")`), runs `getTrackData` +
    `ensureSlugAvailable` + `ensureEligibleTrackFileAsset`, creates the `Track` + the
    `HikesToTracks` row atomically, then triggers `parseTrackGpx` outside the
    transaction so a parse failure does not roll back the write. Returns a discriminated
    `{ ok: true, trackId, trackSlug } | { ok: false, code, message }` for client-side
    error mapping.
- `app/_data/hikes/queries.ts` — `getHikeTrackContributionCapability(hikeId)` returning
  one of five viewer states: `anonymous`, `non-owner`, `owner-trust-ineligible`,
  `owner-quota-reached`, `owner-eligible`. The helper mirrors the trust gate from
  `requireTrustGatedAction("track-upload")` without throwing so the page can render the
  disabled state instead of catching a thrown `InsufficientTrustError`.
- `app/_data/tracks.ts` — `getCreatorUnlinkedTracks(userId)` returns the actor's own
  tracks that have no `HikesToTracks` row, projected to `{ id, title, slug, updatedAt,
  parseState }`. `getActiveTrackActivityTypes()` for the dialog's `Select`.
- `components/hike-pages/hike-track-contribution-form.tsx` — `HikeTrackContributionButton`
  + `HikeTrackContributionDialog`. `Tabs` switch with two sections (`Attach existing` /
  `Upload new`). Embeds `TrackGpxUploadSection`. Reuses the existing
  `markDiscardedTrackGpxFileAssetsPendingDelete` helper for the dirty-close guard.
- `app/(public)/hikes/[slug]/page.tsx` — page server component now loads the capability
  in the existing `Promise.all`, then conditionally loads the unlinked-tracks list and
  active activity types only when the viewer is the eligible creator. The linked tracks
  section is always rendered (with an empty state) so the `Add track` button is reachable
  even on a freshly created trip.
- `app/i18n/locales/{en,ru}/trips.json` — 13 new keys under the existing `trips`
  namespace: `addTrack`, `addTrackQuotaReached`, `addTrackSuccess`, `addTrackError`,
  `addTrackAttachTab`, `addTrackUploadTab`, `addTrackEmptyState`, `addTrackAttachButton`,
  `addTrackAttachError`, `addTrackUploadError`, `addTrackSlugConflict`, `addTrackNotOwner`,
  `addTrackNotTripOwner`.

## 2. Implementation-level decisions that diverged from the proposal

### 2.1 `attachTrackToHike` is admin-gated; new `attachCreatorTrackToHike`

The proposal's design.md said the trip-side attach flow would reuse the existing
`attachTrackToHike` server action unchanged. During implementation, we found
`attachTrackToHike` already calls `getRequiredAdminUserId()` (it is the server action
behind the admin-only `HikeTracksDialog`). Relaxing that gate would have widened the
admin flow's blast radius and could have shadowed the admin `HikeTracksDialog` in
inadvertent ways.

Resolution: added a parallel `attachCreatorTrackToHike` that runs the trip-page flow
under `requireTrustGatedAction("track-upload")` plus a strict `userId === actor.id`
check on both the track and the trip. The existing admin action is untouched.

Implication for future slices: any detach slice should follow the same pattern —
new `detachCreatorTrackFromHike`, leave `detachTrackFromHike` admin-only.

### 2.2 `markDiscardedTrackGpxFileAssetsPendingDelete` is admin-gated

The proposal noted the helper should stay shared. The helper was admin-gated, so the
trip-side dialog's dirty-close flow would have failed for an owner upload. Resolution:
the helper now performs an actor-aware check. The admin path keeps full access
(widened by `isAdmin`); the owner path requires `ownerUserId === actor.id`. The
existing safety guarantees (`purpose: "TRACK_GPX"`, `status: "ACTIVE"`, `track === null`)
apply to both paths.

### 2.3 Per-hike "remainingTrackCount"

The verified-track quota is currently a per-user global cap (`VERIFIED_RESOURCE_LIMITS.track = 10`),
not a per-trip cap like the photo flow. The capability helper surfaces
`remainingTrackCount` as the global remaining (capped at 0). For `TRUSTED` and admin
viewers, the helper returns `remainingTrackCount: null` (uncapped). The dialog uses
this to drive the disabled-feedback message and the button title attribute.

If a per-trip cap is added later (analogous to the photo flow's 10/trip), the
helper's return shape can be extended without breaking the existing consumers.

### 2.4 Linked tracks section always renders

The existing trip page only rendered the `Linked tracks` section when
`hike.tracks.length > 0`. This meant an eligible creator on a freshly created trip
(with no linked tracks) had no `Add track` affordance. The page now always renders the
section header (with an empty state copy when no tracks are linked) and mounts the
contribution button in the header. This is a behavior change vs. the prior
implementation, but the spec and the design are explicit about creator-only access, so
no non-creator viewer is exposed to the new affordance.

## 3. Deferred from this slice

The proposal explicitly defers three follow-ups. These are now candidates in the
backlog, but they were not implemented in feature-110:

- **Trip-page detach of currently-attached tracks** — out of scope. The existing
  admin `HikeTracksDialog` is the only detach path today. A future slice should add
  a creator-gated `detachCreatorTrackFromHike` mirroring `attachCreatorTrackToHike`,
  with its own dirty-close guard (the linked tracks list refreshes via `router.refresh`
  on success, like the attach path).
- **Map-placement track creation on the trip page** — owned by
  `outdoor-track-creation-public` (feature-109) on `/my/tracks`. The trip-side dialog
  ships without a map.
- **Admin override of the creator-only attach** — the capability helper accepts the
  admin path (`user.role === "admin"`), so admins can use the new trip-side affordance
  on their own trips. The `createTrackAndAttachToHike` server action explicitly
  rejects admin-created rows when the trip's `userId` is not the actor (admin
  cross-user creation is deferred).

## 4. Validation status (2026-10-09)

- `npm run tsc` — passes.
- `npm run lint` — passes (only 20 pre-existing `react-refresh/only-export-components`
  warnings on unrelated files).
- `npm run build` — passes; all 38+ routes including `/trips/[slug]` are emitted.
- `npm run fix` — auto-fixes applied for prettier formatting in `app/_actions/files.ts`,
  `app/_data/hikes/types.ts`, `app/_data/tracks.ts`.
- Manual browser smoke test (task 6.4) — not run by Claude; candidate row added to
  `openspec/backlog.md` as `outdoor-hike-owner-track-upload-manual-qa` with a checklist
  covering attach-existing, upload-new, published/draft publication propagation, all
  five viewer states, dirty-close guard, slug conflict, server-rejection dialog
  retention, and `/my/tracks` + `/admin/tracks` regression check.

## 5. Files touched

Created:
- `components/track-pages/track-gpx-upload-section.tsx`
- `components/hike-pages/hike-track-contribution-form.tsx`
- `docs/outdoor-trip-track-contribution-2026-10-09.md`

Modified:
- `components/admin-pages/tracks-admin-panel.tsx` — refactor to consume shared section
- `app/_actions/files.ts` — relax `markDiscardedTrackGpxFileAssetsPendingDelete` gate
- `app/_data/hikes/mutations.ts` — add `attachCreatorTrackToHike` + `createTrackAndAttachToHike`
- `app/_data/hikes/queries.ts` — add `getHikeTrackContributionCapability`
- `app/_data/hikes/types.ts` — add `HikeTrackContributionCapability`, `CreatorUnlinkedTrack`,
  `CreateTrackAndAttachToHikeInput`, `CreateTrackAndAttachToHikeResult`
- `app/_data/hikes/index.ts` — export new actions and types
- `app/_data/tracks.ts` — add `getCreatorUnlinkedTracks`, `getActiveTrackActivityTypes`;
  export `CreatorUnlinkedTrack`; export previously private `getTrackData`,
  `ensureSlugAvailable`, `ensureEligibleTrackFileAsset` for the new actions
- `app/(public)/hikes/[slug]/page.tsx` — wire the new capability and button
- `app/i18n/locales/{en,ru}/trips.json` — 13 new keys per locale
- `openspec/backlog.md` — move candidate to Done; add manual-QA candidate row

No new dependencies, no schema changes, no migration, no new trust action registration,
no new quota type.
