# Design

## Context

Feature-112 shipped the schema columns (`Track.recordingStartAt`, `Track.recordingDurationSeconds`, `Track.timeSource`) and the `TrackTimeSource { GPX, MANUAL, NONE }` enum, plus the `Place on map` editor-side form fields. The four public surfaces that show track time metadata today (`/tracks/[slug]`, `/tracks`, `/admin/tracks`, the published-trip linked-track card in `components/hike-pages/hike-trip-media.tsx`) all read from `track.parsed.summary.time` (GPX only) and `track.recordingTimezone`. None of them reads the new columns. The schema is already complete; the change is read-only display + a small read-side projection extension.

## Goals / Non-Goals

**Goals:**
- Make `Track.timeSource` visible on all four surfaces via a single localized badge so a reader can distinguish `GPX`-sourced tracks from `MANUAL`-created ones at a glance.
- For `MANUAL` tracks, surface the owner's optional recording start and recording duration next to the existing recording-timezone display using the existing `formatTrackRecordingDateTime` and `formatTrackDuration` helpers.
- Keep the change purely additive on the read path: extend the Prisma selects, extend the existing `PublicTrack` / `AdminTrack` / linked-track card types, and render the new lines. No new server actions, no auth changes, no schema migration, no parsing changes.

**Non-Goals:**
- No display-only change is reversible on the surface itself (we don't add an owner setting to "hide" the new badge) — visibility is unconditional.
- No re-design of the existing GPX `parsed.summary.time` block; that block stays byte-identical for GPX tracks.
- No edits to the `Place on map` editor (the in-tab `timeSource` badge and the four input fields were shipped by feature-112 and are read-only on the addendum's path).
- No public filtering or sorting by `timeSource`, no badges in list pages beyond the four surfaces named in the proposal.
- No persistence changes for GPX tracks; the columns remain null and the parsed block remains the source of truth.

## Decisions

### Decision: Extend the existing read-side selects rather than introduce a new projection method

The four surfaces already have well-defined read-side helpers (`getPublicTrack` for `/tracks/[slug]`, `getPublicTrackList` for `/tracks`, `getAdminTrackList` for `/admin/tracks`, and the linked-track card projection in the trip media helper for `/trips/[slug]`). Each one already calls a single `prisma.track.findMany({ select: { ... } })` shape and maps the result through a small projection. Extending those existing selects with three new scalar fields (`recordingStartAt`, `recordingDurationSeconds`, `timeSource`) is the minimum diff.

**Alternatives considered:**
- *Add a parallel `getPublicTrackWithTimeMetadata` projection* — rejected. The four surfaces all already use the same scalar shape; introducing a parallel projection would duplicate the existing `select` block and force callers to choose which projection to use. The fields are tiny scalars and safe to read together.
- *Compute `timeSource` on the client from a different signal* — rejected. The enum value is the authoritative source; computing it client-side would require shipping derived data and a re-implementation of feature-112's `computedTimeSource` derivation logic.

### Decision: Add a `formatTrackTimeSource(enum)` helper in `lib/track-gpx-metadata.ts`

The existing `lib/track-gpx-metadata.ts` already owns read-only display helpers for track metadata (`formatTrackDuration`, `formatTrackRecordingDateTime`, `formatTrackRecordingTimezone`, `formatTrackTimezoneEvidence`). Adding a sibling `formatTrackTimeSource(value?: TrackTimeSource | null)` there matches the established file shape and keeps the four surfaces consistent.

**Alternatives considered:**
- *Inline a `switch` in each of the four rendering call sites* — rejected. The label text is localized, the badge variant likely differs per value, and a switch repeated four times is a maintenance hazard the moment we add a fifth surface or rename a label.
- *Add a `formatTrackTimeSource` helper in a new file* — rejected. The helper is conceptually a peer of `formatTrackTimezoneEvidence` and belongs in the same module.

### Decision: Reuse the existing shadcn `<Badge>` primitive for the timeSource badge

The hike linked-track card and `/tracks` already use `<Badge variant="secondary">` for the recording-timezone and timezone-evidence badges. Using the same primitive with `variant="secondary"` for `MANUAL`, `variant="outline"` for `NONE`, and a new `variant="secondary"` for `GPX` keeps the visual vocabulary consistent and avoids introducing a new UI primitive.

**Alternatives considered:**
- *Create a `TrackTimeSourceBadge` component* — rejected for this slice. The badge is a single primitive call site, four times, and the variant/label mapping is identical across surfaces. A dedicated component adds an indirection without a real second consumer.

### Decision: Place the timeSource badge on each surface adjacent to the existing recording-timezone badge

On the linked-track card, the `Recording timezone` and `Timezone evidence` badges already sit next to the existing recording-time range. Adding the `timeSource` badge next to them keeps the four time-related signals visually grouped. On `/tracks/[slug]`, the `timeSource` badge sits at the top of the parsed summary block (above `Recording start`). On `/tracks` and `/admin/tracks`, the badge sits next to the existing summary values on the card/row.

### Decision: Reuse existing i18n keys for `MANUAL` and `NONE`; add one new key for `GPX`

The `Place on map` editor already uses `placeOnMapTimeSourceManual` and `placeOnMapTimeSourceNone` for the in-tab read-only badge. Reusing these from the four new surfaces means the editor and the public surfaces agree on the wording for `MANUAL`/`NONE`. We add only one new key (`trackTimeSourceGpx`) for the missing `GPX` variant; reusing the editor keys (rather than introducing a parallel `trackTimeSourceManual`/`trackTimeSourceNone` namespace) avoids a translation drift between the editor badge and the public badge.

**Alternatives considered:**
- *Introduce a new `trackTimeSource{Manual,None,Gpx}` namespace with three new keys* — rejected. The editor and public badges would render different strings for the same value, which is the kind of small inconsistency that is hard to spot in review and impossible to fix via copy-paste.

### Decision: Server-side render only; no client-side hydration for the new badge or lines

All four surfaces are server components (or pass server-fetched data into small client islands). The new badge and lines consume only already-fetched scalar fields, so a server-render keeps the diff localized to the four page/component files and avoids any client-component boundary expansion.

## Risks / Trade-offs

- *Inconsistent display if a future slice changes the `TrackTimeSource` enum* → Mitigation: the `formatTrackTimeSource` helper returns the same localized label every page uses, so any future enum change funnels through one helper.
- *The `MANUAL` recording start uses the track's `recordingTimezone`, not the viewer's browser timezone* → Acceptable trade-off: feature-075 already established the "render in persisted recording timezone" rule for GPX times, and the same rule should apply for consistency. The badge surfaces `Track.recordingTimezone` next to it on the linked-track card and detail page so the timezone is always visible.
- *A legacy GPX track with a non-null `recordingStartAt` or `recordingDurationSeconds` (from before feature-112 backfilled it as null) would render both the parsed block and the MANUAL line* → Mitigation: the spec scenario "GPX tracks keep parsed times as the source of truth and do not write the new columns" plus the existing backfill in feature-112 (which set every pre-existing `Track.timeSource` to `GPX`) means a GPX track with non-null new columns does not exist in practice. If a future slice introduces one, the conditional `timeSource === MANUAL` guard on the new lines prevents the duplication.
- *Adding three fields to four read-side selects is a tiny but real query cost* → Acceptable: the fields are scalar and nullable, and the four pages already load the `metadata` JSON blob, which dwarfs the cost.

## Migration Plan

No database migration is required — the columns and enum were added by feature-112 with a backfill that set `timeSource = GPX` for every pre-existing track. The change is a series of in-place edits to four page/component files plus the read-side data helpers. Rollback is `git revert` of the change commit; no data is at risk.

## Open Questions

- *Should the public trip linked-track card show the new `Recording start` / `Recording duration` lines for `MANUAL` tracks, or only the badge?* The current proposal says yes (same rules as the other three surfaces). If the card feels too crowded after a visual review, this can be revisited as a follow-up without changing the spec, since the requirement is "the same conditional rules".
- *Should the existing recording-time display on the four surfaces get a `Rec. start` (short label) variant for narrow list cards?* Out of scope for this slice; can be addressed by a future label-density pass if needed.