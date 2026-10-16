# Proposal

## Why

A verified/trusted trip owner can attach a track to one of their trips from the public trip page via the `Add track` dialog. The resulting `Track` row is saved with `status: "DRAFT"` (the established default — the owner promotes it to `PUBLISHED` later via `/my/tracks` or the admin track surfaces). Today, however, the public trip page query filters linked tracks down to `status: "PUBLISHED"` only (`publicHikeInclude.tracks.where` in `app/_data/hikes/types.ts:82-85`, surfaced by `getPublicHikeBySlug` in `app/_data/hikes/queries.ts:147-156`), so the owner opens `/trips/[slug]` and sees no trace of the track they just attached. This makes the `Add track` affordance feel broken — a one-way action whose result the owner cannot see without leaving the page.

This change adds an owner-only visibility rule: when the viewer of a published trip page is the trip creator or an authenticated administrator, the linked-track list and the trip map also render every associated `DRAFT` track the owner owns, with a clear visual indicator that those rows are drafts. Anonymous viewers and non-owner signed-in viewers (including accepted participants) keep the existing `PUBLISHED`-only rendering.

## What Changes

- Extend the public trip page query to additionally return the trip creator's `DRAFT` linked tracks when the viewer is the trip creator or an administrator. The selection stays scoped to tracks whose `Track.userId` matches the trip creator's `Hike.userId` — other users' `DRAFT` tracks are never exposed, even when a different signed-in user is viewing the page.
- Add a `viewer: "owner" | "admin" | "non-owner" | "anonymous"` signal (or equivalent) alongside the existing `getPublicHikeBySlug` data flow so the render layer can decide which tracks to show and how to badge them. The existing `getHikeTrackContributionCapability` helper already detects the same `isCreator` / `isAdmin` boundary at `app/_data/hikes/queries.ts:517-523`; this change reuses the same boundary rather than introducing a parallel check.
- Render the `DRAFT` rows in the trip's linked-track card list (`HikeTripMedia`'s `linkedTracks` consumer at `components/hike-pages/hike-trip-media.tsx:62`) with a localized `Draft` badge and a muted visual style that is unmistakably distinct from a published track, but still clickable to the public track detail page (`/tracks/[slug]`) so the owner can verify the row.
- Render the owner's `DRAFT` tracks on the trip map as a separate polyline layer so the owner can visually inspect their placement, again distinct from published tracks. Reuse the existing track polyline pipeline; do not add a new map provider.
- Keep the `Add track` upload form unchanged — it still defaults to `status: "DRAFT"`, exactly as it does today. Promotion to `PUBLISHED` still happens via `/my/tracks` (or a future in-place control). This slice is purely render-side visibility.
- No change to the public track detail page `/tracks/[slug]`: the linked-hike list there continues to show only the published hikes that contain this track, and the inverse "track is in a draft hike" rule (already in `outdoor-hike-media-map` — "Published track is linked to draft hike") is unaffected because the trip itself is `PUBLISHED` (the page is unreachable when the trip is a draft).

## Non-Goals

- Not adding a "Promote to published" affordance on the trip page. Drafts are still promoted via `/my/tracks` or the admin track surfaces; that control belongs to a separate slice.
- Not changing the trip page `Add track` dialog, its quota gate, its trust gate, or its default status.
- Not exposing `DRAFT` linked tracks of *other* users, even when the current viewer is an administrator. The owner rule is anchored to the trip's own creator; an admin's view of a trip the admin does not own stays `PUBLISHED`-only on this slice (admins can still see all drafts through `/admin/tracks`).
- Not changing `/my/tracks`, `/admin/tracks`, the public track detail, the public track list, the trip list, or any other surface.
- Not adding a "Hide drafts" toggle on the trip page. The badge is informational; if the owner wants to ignore their drafts they can do so visually.
- Not extending this rule to linked photos. `Photo` is a separate capability and ships its own draft behavior in `outdoor-photo-comments`; it is intentionally out of scope here.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: extends the "Public hike pages show linked published tracks" requirement with owner-visible DRAFT tracks. Adds scenarios covering: (a) the trip creator sees their own DRAFT tracks in the linked-track list and on the trip map, (b) the trip creator sees a `Draft` badge / muted style on those rows, (c) an administrator viewing a trip they did not create continues to see `PUBLISHED`-only, (d) anonymous and non-owner viewers are unchanged, (e) the `DRAFT` rule never leaks another user's drafts. The existing "Draft track is linked to published hike" scenario (which states "public hike pages SHALL NOT expose that draft track") is tightened with an exception clause for the owner / admin actor; the "PUBLISHED-only by default" intent is preserved for everyone else.

## Impact

- **Schemas**: none. No Prisma migration; no new columns or enums.
- **APIs**: none. `getPublicHikeBySlug` keeps the same return shape (`PublicHike`); the only change is that `hike.tracks` may now contain a superset (additional `DRAFT` rows) when the viewer is the owner or admin. The component contract for `HikeTripMedia` (`linkedTracks: LinkedTrack[]`) is unchanged; the type already carries `status: "DRAFT" | "PUBLISHED"` and is already rendered conditionally.
- **Code**
  - **Modified**: `app/_data/hikes/queries.ts` — `getPublicHikeBySlug` (or a small adjacent helper) accepts the resolved session and applies an additional `OR` branch on the tracks filter that includes `status: "DRAFT"` rows owned by the trip creator when the viewer is the creator or admin. The query still uses the existing `publicHikeInclude` shape so the type contract is preserved.
  - **Modified**: `app/_data/hikes/types.ts` — `publicHikeInclude` (or the callsite that constructs it) is parameterized to receive the viewer-derived `includeDrafts: boolean` flag; the change keeps the `where` typed and uses `Prisma.HikeInclude` so type inference is unaffected.
  - **Modified**: `app/(public)/hikes/[slug]/page.tsx` — `TripPage` already loads `authSession()` and `getHikeTrackContributionCapability(...)`; pass the resolved creator/admin signal into the data fetch, and use the same `isCreator || isAdmin` boundary as `getHikeTrackContributionCapability` so there is no risk of a drift between the two checks.
  - **Modified**: `components/hike-pages/hike-trip-media.tsx` — when a `LinkedTrack` has `status === "DRAFT"`, render a localized `Draft` badge in the card header and apply a muted wrapper class. The map layer similarly renders DRAFT polylines in a muted color. The existing day-filter and recording-timezone rendering apply unchanged.
  - **Modified**: `app/i18n/locales/{en,ru}/trips.json` — one new `linkedTrackDraftBadge` key (e.g. `"Draft"` / `"Черновик"`) for the badge text.
- **Dependencies**: none. `lucide-react`, `Badge`, and the existing leaflet polyline pipeline are already in place.
- **Localization**: a single new badge key per locale. No new strings in the rest of the page.
- **Spec**: delta at `openspec/changes/feature-115-outdoor-trip-owner-draft-track-visibility/specs/outdoor-hike-media-map/spec.md` extending the "Public hike pages show linked published tracks" requirement with the owner-visible DRAFT scenarios and tightening the "Draft track is linked to published hike" scenario with the owner/admin exception.
