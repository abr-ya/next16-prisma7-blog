# Outdoor tracks feature research — 2026-10-07

## Context

Pre-planning research for two upcoming outdoor features on the trip/track domain:

1. **Track point deletion** — let users edit an existing track and remove bad points/segments, including optional auto-suggestion of suspicious points based on speed-from-last-reliable-point.
2. **Track creation** — let users place points directly on a map to create a new track (no GPX upload), optional type/start time/total movement time, auto-calculate distance, later attachable to a trip.

Goal: understand what already exists so OpenSpec proposals are grounded in real structure, not guesses.

Produced by: Explore subagent (`a3e94e5163eb1da55`).
Project branch at the time of research: `feature-107-outdoor-public-trip-add-button` (proposal-only — no code yet).
Project root: `/home/user/full2026/next16-prisma7-blog`.

Use this doc when drafting `openspec/changes/feature-XXX-outdoor-track-*/` proposals. Reference it from the backlog entry for each new feature so reviewers can quickly ground themselves.

---

## 1. Prisma schema (`prisma/schema.prisma`)

Single schema file. **No `TrackPoint` / `GpsPoint` / `TrackSegment` model.** A track does not store points in the database. Points are parsed from the GPX file at upload and reduced to a `metadata` JSON blob on `Track`.

Outdoor-domain models (lines 232–434):

- **`Hike`** (lines 268–289) — the "trip" entity. The model name is still `Hike` even though routes/UI use the word "trip" (see feature-069 rename in archive). Fields: `id` (uuid), `title`, `slug` (@unique), `description?`, `startDate`, `endDate`, `type HikeType`, `status HikeStatus` (@default DRAFT), `userId` → `User`, `tracks` via `HikesToTracks[]`, `photos` via `HikesToPhotos[]`, `notes HikeNote[]`, `participants HikeParticipant[]`, `createdAt`, `updatedAt`. Indexes on `status`, `[startDate, endDate]`, `userId`.
- **`HikeParticipant`** (291–310) — invite-based: `hikeId`, `userId`, `invitedById`, `status HikeParticipantStatus`, `invitedAt`, `respondedAt?`, `expiresAt?`. Unique on `[hikeId, userId]`.
- **`HikeNote`** (312–327) — `hikeId`, `title`, `body?`, `latitude? Float`, `longitude? Float`, `dayKey?`, `status HikeNoteStatus`. Already stores per-note lat/lng but not a track point.
- **`Track`** (329–350) — `id` (uuid), `title`, `slug` (@unique), `description?`, `status TrackStatus` (@default DRAFT), `fileAssetId` (@unique → `FileAsset`), `fileAsset FileAsset` (onDelete: Restrict), **`metadata Json?`** (the parsed GPX summary lives here), `recordingTimezone String?`, `activityTypeId String?` → `TrackActivityType` (Restrict), `userId` → `User`, `hikes HikesToTracks[]`, `createdAt`, `updatedAt`. Indexes on `status`, `userId`, `activityTypeId`.
- **`TrackActivityType`** (352–363) — `id`, `key` (@unique), `nameEn`, `nameRu?`, `isActive Boolean @default(true)`.
- **`HikesToTracks`** (365–374) — explicit M2M join. `@@id([hikeId, trackId])`, plus `assignedAt`. Note that the **direction is `hike ↔ track`, not "track has one trip"** — a track can be linked to multiple hikes.
- **`Photo`** (376–394), **`PhotoLike`** (396–407), **`HikesToPhotos`** (409–421), **`PhotoImage`** (423–434) — photo system, also relevant because photos already use the `HikesToPhotos` M2M.
- **`FileAsset`** (467–491) — the upload-backed storage. `purpose` enum (see below), `visibility` enum (PRIVATE/UNLISTED/PUBLIC), `status` enum (ACTIVE/DETACHED/PENDING_DELETE/DELETED), `ownerUserId`, `track Track?` (the back-link).

Enums in the outdoor slice:

- `HikeStatus { DRAFT, PUBLISHED }` (232)
- `TrackStatus { DRAFT, PUBLISHED }` (236)
- `PhotoStatus { DRAFT, PUBLISHED }` (241)
- `HikeNoteStatus { DRAFT, PUBLISHED }` (246)
- `HikeType { HIKING, MOUNTAIN, WATER, SKI, BIKE, OTHER }` (251)
- `HikeParticipantStatus { PENDING, ACCEPTED, DECLINED, CANCELLED, EXPIRED }` (260)
- `FileAssetPurpose { ADMIN_UPLOAD, ARCHIVE_ATTACHMENT, VIDEO_ATTACHMENT, PREVIEW_IMAGE, RICH_TEXT_IMAGE, STANDALONE_SHARED_FILE, TRACK_GPX, OUTDOOR_PHOTO_IMAGE }` (439) — `TRACK_GPX` is the only purpose that can back a `Track.fileAssetId`. There is no `TRACK_POINT` or similar.
- `FileAssetVisibility { PRIVATE, UNLISTED, PUBLIC }` (454)
- `FileAssetStatus { ACTIVE, DETACHED, PENDING_DELETE, DELETED }` (460)

There is **no** `TrackVisibility` / `HikeVisibility` enum (only the video domain has `VideoVisibility` / `VideoChannelVisibility` — see section 6).

---

## 2. Map library

**Leaflet via `react-leaflet`**. Single map rendering module.

- `components/track-pages/track-map-leaflet.tsx` — the actual `MapContainer`, `TileLayer`, `Polyline`, `Marker`, `CircleMarker`, `Popup`, `Tooltip`, `useMap` from `react-leaflet`. Tile provider is hardcoded to OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with OSM attribution (lines 133–136). Two private helper components `FitMapBounds` and `FocusMapCoordinate` use `useMap()` to control the viewport. There is **no click handler, no `useMapEvents`, no drawing/editing** anywhere — the map is read-only.
- `components/track-pages/track-map.tsx` — `"use client"` wrapper that loads the above dynamically with `ssr: false` (Next.js dynamic import). Exports `TrackMap` (single track) and `CombinedTrackMap` (multi-track + photo/note markers + optional `focusCoordinate` / `previewCoordinate`).
- `components/hike-pages/hike-track-map.tsx` — adds a day-filter `Select` on top of `CombinedTrackMap` and hides layers that lack a dayKey.
- React-leaflet 5.0.0 is installed; `useMapEvents` is available in `node_modules/react-leaflet/lib/hooks.d.ts` but not yet used in app code.

`@types/leaflet` and `leaflet@1.9.4` are in `package.json`. No Mapbox, MapLibre, Google Maps, or react-map-gl.

---

## 3. Outdoor routes

Listed by directory. Routes under `/trips/` are **legacy re-export shims** of `/hikes/` — they exist only to preserve old URLs (see `app/(public)/trips/page.tsx` which is 6 lines importing from `hikes/page`).

**Public:**

- `app/(public)/hikes/page.tsx` — list of published hikes (calls `getPublicHikes`); shows `viewerStatus` badge ("My trip" / "Participant" / "Public trip"). No create button currently.
- `app/(public)/hikes/[slug]/page.tsx` — public trip detail with `HikeTripMedia` (map + photo gallery) and a list of "Linked tracks".
- `app/(public)/trips/page.tsx` — re-exports `TripsPage` from `hikes/page`.
- `app/(public)/trips/[slug]/page.tsx` — re-exports `TripPage` from `hikes/[slug]/page`.
- `app/(public)/trips/invitations/page.tsx` — re-export of participant invitations page.
- `app/(public)/tracks/page.tsx` — public track listing (published only).
- `app/(public)/tracks/[slug]/page.tsx` — public track detail with map + GPX summary + linked hikes + download.
- `app/(public)/my/tracks/page.tsx` — **owner-scoped track management** (added by feature-099; uses `TrackManagementPanel`). Authenticated via `requireAuth()`. The proposal in feature-107 explicitly defers a parallel `/my/trips` page to a future `outdoor-my-trips-page` change.

**Admin:**

- `app/admin/hikes/page.tsx` — `TripsAdminPage`; renders `HikesAdminPanel` with `getAllHikes`, `getAllTracks`, `getHikePhotoOptions`. Loads for both admin and non-admin (panel hides admin-only controls when `!isAdmin`).
- `app/admin/trips/page.tsx` — re-exports `TripsAdminPage`.
- `app/admin/tracks/page.tsx` — `TracksPage`; renders `TracksAdminPanel`.
- `app/admin/track-activity-types/page.tsx` — admin management of activity types.

No placeholders beyond the legacy `/trips/` aliases.

---

## 4. Track / trip components

- `components/admin-pages/hikes-admin-panel.tsx` — the main trip admin UI. Contains `HikeFormDialog` (title, slug, description, startDate, endDate, type, status — no point/geometry editing), `HikeTracksDialog` (attach/detach existing tracks to a hike), `HikePhotosDialog` (attach/detach photos, including a sub-dialog for approving track-time map coordinates), `HikeNotesDialog` (create/edit/delete text+lat+lng notes).
- `components/admin-pages/tracks-admin-panel.tsx` — `TrackManagementPanel` (also re-exported as `TracksAdminPanel`). Contains `TrackFormDialog` (title, slug, description, status, fileAsset, activityType) with an `UploadDropzone` for GPX upload and a "Parse GPX" action. The dirty-close guard logic lives here (`markDiscardedTrackGpxFileAssetsPendingDelete`).
- `components/track-pages/track-map.tsx` and `track-map-leaflet.tsx` — see section 2.
- `components/hike-pages/hike-track-map.tsx` — wraps `CombinedTrackMap` with a day filter.
- `components/hike-pages/hike-trip-media.tsx` — orchestrates map + photo gallery on the public trip page.
- `components/hike-pages/hike-photo-gallery.tsx` — photo viewer / uploader for trips (separate from track editing).
- `components/hike-pages/hike-invitations.tsx`, `hike-participant-manager.tsx`, `hike-photo-detail-summary.tsx`, `hike-photo-comment-composer.tsx`, `hike-photo-contribution-form.tsx`, `hike-photo-coordinate-review.tsx` — photo/participant UX.

**No track point list view, no track point editor, no map-click-to-add-point component, no point removal UI.** The track form has no map; map components have no input controls.

---

## 5. Trip creation flow / feature-107 status

`git diff master..HEAD --name-only` shows the branch ahead of `master` has only documentation:

```
openspec/backlog.md                                |  3 +-
.../.openspec.yaml                                 |  2 +
.../design.md                                      | 50 ++++++++++++++++++++
.../proposal.md                                    | 29 ++++++++++++
.../specs/outdoor-hikes/spec.md                    | 54 ++++++++++++++++++++++
.../tasks.md                                       |  20 ++++++++
```

So **feature-107 is currently proposal-only** — no code yet. Key references:

- `openspec/changes/feature-107-outdoor-public-trip-add-button/proposal.md` — adds an always-visible `Add Trip` control on public `/trips`, eligible-user public creation dialog, and shared form extraction from `components/admin-pages/hikes-admin-panel.tsx` into new `components/forms/trips/` and `components/dialogs/trips/` modules. **Tracks and points are out of scope.**
- `tasks.md` confirms steps 1.1–3.4 with extraction targets `components/forms/trips/` and `components/dialogs/trips/`.
- `specs/outdoor-hikes/spec.md` adds the `outdoor-hikes` requirement "Eligible users can create trips from the public Trips listing".

There is **no stub component** for the public trip-add button on the current branch — only the proposal/spec/design. The existing trip creation mutation lives at `app/_data/hikes.ts` (`createHike`, line 2251) and is gated by `requireTrustGatedAction("trip-create")` + `assertVerifiedResourceQuota(tx, user, "trip")` inside a `prisma.$transaction`. The form schema, defaults, and the entire `HikeFormDialog` are inline in `hikes-admin-panel.tsx` (lines 87–428).

---

## 6. Visibility / permission patterns

No `TrackVisibility` / `HikeVisibility` enums exist. The outdoor domain uses **`*Status { DRAFT, PUBLISHED }` as the public/private gate**:

- Public track listings: `where: { status: "PUBLISHED" }` — `app/_data/tracks.ts:411`.
- Public trip listings: `where: { status: "PUBLISHED" }` — `app/_data/hikes.ts:1344` (in `getPublicHikes`).
- Public trip detail: `where: { slug, status: "PUBLISHED" }` — same file, line 1372.
- Owner-scoped mutations enforce ownership via `where: { userId }` clauses — see all mutations in `app/_data/tracks.ts:387–616` and similar in `hikes.ts`.
- `HikeViewerStatus = "creator" | "participant" | "viewer"` is computed server-side in `getPublicHikes` (lines 1349–1365) based on `session.user.id` and accepted `HikeParticipant` records. It is purely a display hint, not a permission check.
- `requireTrustGatedAction` (`lib/auth-trust-gates.server.ts:37`) is the trust gate for mutations; registered actions: `"like" | `"comment" | `"trip-create" | `"photo-upload" | `"track-upload"`. Administrators bypass trust (line 48).
- `assertVerifiedResourceQuota` (`lib/auth-trust-quotas.server.ts:33`) caps `trip: 3`, `photo: 30`, `track: 10` for VERIFIED users; TRUSTED and admins are uncapped.
- `requireOwnerOrAdmin(ownerId)` helper at `lib/auth-utils.ts:100` is the generic "owner or admin" pattern.
- The analogous visibility enums called out in `CLAUDE.md` are `VideoVisibility { PRIVATE, PUBLIC }` and `VideoChannelVisibility { PUBLIC, HIDDEN }` (`schema.prisma:523, 528`). The outdoor domain **does not** mirror these — it uses DRAFT/PUBLISHED only.

---

## 7. Distance / geo utilities

No standalone module. All geo math is private to:

- `lib/track-gpx-parser.ts`:
  - `EARTH_RADIUS_METERS = 6371000`, `toRadians`, `distanceBetweenPoints(from, to)` (Haversine, lines 92–105)
  - `computeBounds(points)` (107), `computeDistance(points)` (123), `computeElevation(points)` (130), `computeTime(points)` (162)
  - `simplifyDouglasPeucker` (204), `thinToMaxPoints` (245), `simplifyMapGeometry` (259) — geometry simplification for map display
  - `parseGpxPoints(content)` (61) — XML regex parser for `trkpt`/`rtept`; populates `{ele?, time?, timeTimezoneEvidence?}`
- `lib/track-gpx-metadata.ts`:
  - `TrackGpxCoordinate { lat, lng }`, `TrackGpxBounds`, `TrackGpxSummary { distanceMeters, bounds, elevation, time, points }`, `TrackGpxMetadata { gpxParse, summary, mapGeometry, timeline }`
  - `parseTrackGpxMetadata` returns a SUCCESS/FAILED/STALE state; parsers cap at `MAX_SIMPLIFIED_POINTS = 1000` and `MAX_TIMELINE_POINTS = 400`.
  - Formatters: `formatTrackDistance`, `formatTrackDuration`, `formatTrackElevationRange`, etc.
- `lib/outdoor-photo-track-time-matching.ts` — duplicates Haversine inline (lines 134–138) for photo-to-track interpolation.
- `lib/gpx-validation.ts` — `hasGpxFilename`, `hasAllowedGpxMimeType`, `validateGpxUploadMetadata`, `validateGpxContent`. **Used by `app/api/uploadthing/core.ts` for the `trackGpxUploader` route.**
- `lib/hike-map-markers.ts` and `lib/hike-map-days.ts` — server-side marker clustering / day splitting helpers.

**No `@mapbox/polyline`, no `leaflet-draw`, no `leaflet-editable`, no `@turf`, no `polyline` package in `package.json`. No speed-from-last-point / outlier detection helper exists anywhere.**

---

## 8. Dialog / modal pattern

`Dialog` is the established pattern (Radix-based, defined in `components/ui/dialog.tsx`). It is built on `@radix-ui/react-dialog` and re-exported from `components/index.ts:6-14` as `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `DialogTrigger`. `DialogContent` defaults to `sm:max-w-lg`; existing trip/track dialogs use `sm:max-w-2xl` or `sm:max-w-3xl`, and `HikeNotesDialog` uses `max-h-[90vh] overflow-y-auto`. There is also a `Sheet` primitive (`components/ui/sheet.tsx`) but it is only used by the sidebar — not by any editor.

Other relevant UI primitives in `components/ui/`: `badge`, `button`, `card`, `dropdown-menu`, `form` (a `FormProvider` re-export with `FormField`/`FormControl`/`FormItem`/`FormLabel`/`FormMessage`), `input`, `label`, `popover`, `select`, `separator`, `sonner` (toast), `spinner`, `tabs`, `tooltip`, `table`, `breadcrumb`, `navigation-menu`, `avatar`, `skeleton`. `Form` is wired to `react-hook-form` + `@hookform/resolvers/zod` everywhere (`components/admin-pages/hikes-admin-panel.tsx:2,3,20`; `tracks-admin-panel.tsx:3,9`; `category-form.tsx`, `md-doc-form.tsx`, `photos-admin-panel.tsx`, `post-form.tsx`, etc.).

`ConfirmDialog` is in `components/common/confirm-dialog.tsx` and re-exported from `components/index.ts:24`.

**No existing full-screen editor pattern** is in the codebase. All forms live inside `Dialog`s with `max-h-[90vh] overflow-y-auto` for scrollable content. The photo-gallery viewer (`hike-photo-gallery.tsx`) uses full-screen overlays via `fixed inset-0` but that's a viewer, not an editor.

Toasts use `sonner` (`import { toast } from "sonner"`), called after every mutation in the admin panels.

---

## Extra signals worth noting before proposal writing

- **Domain-rename history**: feature-069 ("outdoor-hike-to-trip-domain-rename") renamed the URL space (`/trips`) and display strings ("Trip") to use "trip", but the Prisma model is still `Hike` (and so are the type names `HikeStatus`, `HikeType`, `HikeListItem`, etc., and table names). OpenSpec specs are `outdoor-hikes`, `outdoor-trips`, `outdoor-tracks`. New code should follow the existing naming: model `Track`, model `Hike`, "trip" only in user-facing copy.
- **Feature-099 (`/my/tracks`)** — owner-scoped track management is already live; archived spec at `openspec/changes/archive/2026-09-29-feature-099-outdoor-my-tracks-page/specs/outdoor-tracks/spec.md`. It uses the same `TrackFormDialog` and `TrackManagementPanel` as the admin page. Anything new for tracks can be slotted into that page.
- **Feature-105/106 trail**: `outdoor-track-activity-types` is a separate spec at `openspec/specs/outdoor-track-activity-types/` and is a model-level concern, not a streaming-of-points concern. It is referenced from `Track.activityTypeId`.
- **No write-through of edited points**: `Track.metadata` is regenerated by re-running `parseTrackGpx` against the `FileAsset` (URL is fetched on demand, see `parseTrackGpx` at `app/_data/tracks.ts:543`). Editing the geometry implies either (a) rewriting the GPX file in `FileAsset` and re-parsing, or (b) storing a separate "edited geometry" JSON on the Track. There is no precedent for option (b) today.
- **GPX file size cap**: `TRACK_GPX_UPLOAD_MAX_BYTES = 16 * 1024 * 1024` (`lib/file-upload-limits.ts:5`). Used both as UploadThing middleware (`core.ts:120`) and as `TRACK_GPX_UPLOAD_MAX_SIZE = "16MB"` for client-side messaging.

---

## Open decisions (for upcoming OpenSpec proposals)

1. **Storage model for edited/manual points** — store excluded indices/segments, or new JSON `editorOverrides` field, or rewrite GPX in `FileAsset`?
2. **GPX-less track creation** — should `Track.fileAssetId` become nullable, or generate a synthetic GPX and reuse the parsing pipeline?
3. **`Track` schema additions** for hand-created tracks: `recordingStartAt`, `recordingDurationSeconds`, optional `timeSource` enum (`GPX | MANUAL | NONE`)?
5. **Map component reuse** — extend `TrackMapLeaflet` with `mode: "view" | "create" | "edit"` and shared `useMapEvents` handler, or split into a separate `TrackEditorMap`?
6. **Trust/quota gates** — register a new trust action like `"track-edit"`, or use existing owner check only?
7. **Surface area** — modal dialog (matches existing patterns) vs new full-screen route for long tracks?

These should be answered in the proposal/design phase, not assumed here.