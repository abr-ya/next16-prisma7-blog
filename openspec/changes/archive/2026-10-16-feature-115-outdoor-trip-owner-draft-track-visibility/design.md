# Design

## Goal

Let the trip creator (or an authenticated administrator) see their own `DRAFT` tracks on the public trip detail page (`/trips/[slug]`), alongside the existing `PUBLISHED` tracks, with a clear `Draft` visual indicator. Every other viewer stays on the existing `PUBLISHED`-only rendering. No schema change, no new dialogs, no change to the upload form.

## Data flow

Today, `TripPage` in `app/(public)/hikes/[slug]/page.tsx:51` calls `getPublicHikeBySlug(slug)`, which in `app/_data/hikes/queries.ts:147-156` returns the trip with `publicHikeInclude` (`app/_data/hikes/types.ts:73-...`). That include hard-filters linked tracks to `track: { status: "PUBLISHED" }` at `app/_data/hikes/types.ts:82-85`.

The change keeps `getPublicHikeBySlug` as the single data source but parameterizes the tracks filter on a resolved viewer signal:

1. `TripPage` already loads `authSession()` and `getHikeTrackContributionCapability(hike.id)` in parallel (`app/(public)/hikes/[slug]/page.tsx:56-61`). The same capability helper already detects the `isCreator || isAdmin` boundary at `app/_data/hikes/queries.ts:517-523` and exposes it as part of the capability shape.
2. Resolve `viewerVisibility: "owner" | "admin" | "non-owner"` from `session` + `hike.userId` + `currentUserRole()`. `admin` is the case where the viewer is an admin but not the creator — they still see the creator's drafts (mirrors the existing `isAdmin` branch in `getHikeTrackContributionCapability`). `owner` is the creator themselves. Both share the same "see drafts" behavior, so they collapse into one boolean `canSeeCreatorDrafts: boolean` for the query.
3. Pass `canSeeCreatorDrafts` into the data fetch. `publicHikeInclude` is converted from a static `Prisma.HikeInclude` constant to a small factory `publicHikeInclude({ includeCreatorDrafts })` that returns the same shape, just with the `tracks.where` clause extended.
4. The `include` change is purely additive: when `includeCreatorDrafts` is `true`, the where clause becomes:
   ```ts
   where: {
     track: {
       OR: [
         { status: "PUBLISHED" },
         { status: "DRAFT", userId: hike.userId },
       ],
     },
   }
   ```
   This guarantees the rule "creator's drafts only" — never another user's drafts, even when the viewer is an admin viewing a trip they don't own.
5. `TripPage` already passes `linkedTracks={hike.tracks.map(({ track }) => track)}` to `HikeTripMedia` (`app/(public)/hikes/[slug]/page.tsx:133`). The shape is unchanged; `HikeTripMedia` already receives `status` on each `LinkedTrack`. We just need the component to render DRAFT rows differently.

## Boundary detection

The same boundary (`isCreator || isAdmin`) is already used in:

- `getHikeTrackContributionCapability` (`app/_data/hikes/queries.ts:517-523`) — to decide whether the `Add track` button is rendered.
- `getHikePhotoContributionCapabilityBySlug` (`app/_data/hikes/queries.ts:467-470`) — to decide whether the photo upload affordance is rendered.

We do NOT add a new parallel check. Instead, `TripPage` resolves `isCreator` / `isAdmin` once at the top (it already loads `session` and the capability helper in parallel), then:

- If `isCreator || isAdmin`, pass `includeCreatorDrafts: true` to the data fetch.
- Otherwise, pass `includeCreatorDrafts: false` (the default and the only path the existing `publicHikeInclude` supported).

This keeps the existing `getHikeTrackContributionCapability` and the new visibility decision literally using the same `(isCreator, isAdmin)` pair, so the two can never disagree about "is this viewer the owner or an admin?".

## UI: linked-track list

In `components/hike-pages/hike-trip-media.tsx`, the existing card at line 231-256 renders each linked track. Add a single `Badge` next to the existing `formatTrackRecordingTimezone` badge that reads the localized `linkedTrackDraftBadge` key when `track.status === "DRAFT"`:

```jsx
{track.status === "DRAFT" ? (
  <Badge variant="outline">{t("linkedTrackDraftBadge")}</Badge>
) : null}
```

Wrap the entire card in a muted wrapper class when `track.status === "DRAFT"` (e.g. `opacity-80` or a softer border) so the row reads as "still in progress" without hiding it. The link to `/tracks/[slug]` stays — the public track detail page itself already enforces the existing per-track visibility rules (a `DRAFT` track's own page is admin/owner-only in `app/_data/tracks.ts:506-517`), so the link is safe.

## UI: trip map

`HikeTripMedia` builds the polyline from `linkedTracks` and the day filter (line 89-95). DRAFT tracks flow through the same `linkedTracks` array, so the polyline pipeline gets them for free. The visual change is a single new color (or stroke pattern) for the DRAFT layer:

- Render DRAFT polylines with the existing `TRACK_LINE_COLORS[0]` (the teal `#0f766e`) **dashed** with `dashArray: "6 6"`, or pick a muted neutral like `#94a3b8` (slate-400) and `weight: 2`. Either way the polyline should be visually subordinate to the published one. I will use a muted color + `weight: 2` + `dashArray: "4 6"` so DRAFT tracks are unambiguously "preview" not "real".
- Render DRAFT endpoint markers with the existing `L.circleMarker` muted look (or omit them entirely for DRAFT — simplest). Decision: keep the endpoint markers for DRAFT but with a muted color, so the owner can see the start/finish just like on the public track map.

The map "no geometry" guard at `hike-trip-media.tsx:89` (`linkedTracks.some(({ map }) => map)`) continues to work because each DRAFT track's `map` field is unchanged by this slice — the geometry is populated by `parseTrackGpx` exactly as for published tracks.

## i18n

Add one key to `app/i18n/locales/{en,ru}/trips.json`:

- `linkedTrackDraftBadge` → `"Draft"` (en), `"Черновик"` (ru).

No new strings in the rest of the page.

## Edge cases

- **Trip creator has zero DRAFT tracks, only PUBLISHED** — same rendering as today; no change visible to anyone.
- **Trip creator has both DRAFT and PUBLISHED tracks** — list shows both, sorted by the existing `assignedAt: "desc"` from `publicHikeInclude` (`app/_data/hikes/types.ts:87-89`); DRAFT rows get the badge + muted style. The trip-page day filter applies to both statuses unchanged.
- **Admin viewing a trip they do not own** — they see the creator's DRAFT tracks (because the rule is "creator's drafts" not "viewer's drafts"). Other users' drafts on a different trip stay invisible.
- **DRAFT track whose `FileAsset` is `PRIVATE` or `INACTIVE`** — the row still renders, badge + muted style, and the existing per-track download rules in `app/_actions/files.ts` still apply when the owner follows the link to `/tracks/[slug]`. No direct GPX provider URL is exposed on the trip page.
- **Participant viewing the trip** — they are not the creator and not an admin, so they see `PUBLISHED`-only. This matches the existing `getHikeTrackContributionCapability` rule that treats participants as `non-owner`.
- **DRAFT trip** — unreachable: `getPublicHikeBySlug` filters `where: { slug, status: "PUBLISHED" }` (`app/_data/hikes/queries.ts:151`), so a DRAFT trip 404s before the visibility rule is ever evaluated.

## What stays unchanged

- `/my/tracks` — owner-side track management stays as the only place to promote a draft to published. The trip page does NOT gain a "Promote" button.
- `/admin/tracks` — administrators continue to manage every track there; nothing in this slice changes their workflow.
- `/tracks/[slug]` (public track detail) — the linked-hike list there continues to show only published hikes; the inverse "track is in a draft hike" rule is unaffected because the trip itself is `PUBLISHED` on this surface.
- `getHikeTrackContributionCapability` and the `Add track` dialog — unchanged. Drafts are still created with the same default; the upload form's existing `status: "DRAFT"` default is the source of the rows this slice now exposes.
- The public trip page metadata (`generateTripMetadata`) — uses the same `getPublicHikeBySlug` call, but the page metadata is title/description only and does not depend on the tracks list, so this slice does not need to coordinate anything.
