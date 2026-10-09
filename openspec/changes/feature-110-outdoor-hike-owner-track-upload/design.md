# Design

## Context

See [proposal.md](./proposal.md) for motivation. The current state we build on:

- `app/(public)/hikes/[slug]/page.tsx` is the public trip detail page; `/trips/[slug]` is a re-export alias. The page already renders `HikePhotoContributionButton` (next to the photo gallery) and a list of currently linked tracks (`getReliableTripLinkedTracks` / similar). Track management from this page is currently limited to viewing; mutation requires going to `/admin/trips` (`HikeTracksDialog`).
- `app/_data/hikes.ts` already exports `attachTrackToHike`, `detachTrackFromHike`, and the trust-gated photo path used by `HikePhotoContributionButton`. The same file exports `contributePhotoToHike`, which is the closest behavioral analogue to the new `createTrackAndAttachToHike`.
- `components/admin-pages/tracks-admin-panel.tsx` hosts `TrackFormDialog`, which embeds `UploadDropzone` from `@/lib/uploadthing` and the dirty-close guard logic (`hasUnsavedUploads`, `markDiscardedTrackGpxFileAssetsPendingDelete`, `discardConfirmOpen`). The dialog is reused as-is on both `/admin/tracks` and `/my/tracks`.
- `lib/auth-trust-gates.server.ts` registers `"track-upload"` and `lib/auth-trust-quotas.server.ts` enforces `assertVerifiedResourceQuota(tx, user, "track")` (10 cap, VERIFIED). TRUSTED and administrators are uncapped.
- `components/hike-pages/hike-photo-contribution-form.tsx` is the reference pattern for a public trip-page contribution affordance: a button with disabled-state messaging plus a focused dialog whose submit calls a single server action.

## Goals / Non-Goals

**Goals:**

- Let a trip creator attach one of their own unlinked tracks or upload-and-attach a new GPX from the trip detail page, with one consolidated affordance.
- Reuse the existing upload piece (`UploadDropzone` + parse-GPX + dirty-close guard) verbatim so the trip-side UX never drifts from `/admin/tracks` or `/my/tracks`.
- Reuse `attachTrackToHike` and `createTrack` server-side logic; add one focused new mutation `createTrackAndAttachToHike` that composes them in a transaction.
- Localize every new string in the `trips` namespace (English/Russian); add no new top-level dependency.

**Non-Goals:**

- Detach of currently-attached tracks from the trip page (deferred candidate).
- Map-placement track creation on this surface (owned by feature-109 on `/my/tracks`).
- Participant uploads or attachment of another user's tracks (per candidate text).
- Public `/tracks` entry point or any new admin variant beyond the existing `HikeTracksDialog`.
- Schema or migration changes.
- New trust action registration or quota type.

## Decisions

### 1. Server action: `createTrackAndAttachToHike` lives next to `attachTrackToHike` in `app/_data/hikes.ts`

The new mutation is colocated with the existing `attachTrackToHike` / `detachTrackFromHike` / `contributePhotoToHike` because the trip-side contribution is a triper mutation, not a tracks mutation. The action signature mirrors `contributePhotoToHike`:

```
type CreateTrackAndAttachToHikeInput = {
  hikeId: string;
  title: string;
  slug: string;
  description?: string | null;
  status?: "DRAFT" | "PUBLISHED";          // defaults from hike.status
  fileAssetId: string;                       // already uploaded via the shared UploadDropzone
  recordingTimezone?: string | null;
  activityTypeId?: string | null;
};

type CreateTrackAndAttachToHikeResult =
  | { ok: true; trackId: string }
  | { ok: false; code: "TRUST" | "QUOTA" | "VALIDATION" | "SLUG" | "INTERNAL"; message: string };
```

Flow inside `prisma.$transaction`:

1. `requireTrustGatedAction("track-upload")`.
2. `assertVerifiedResourceQuota(tx, user, "track")`.
3. Validate trip ownership: `tx.hike.findUnique({ where: { id: hikeId }, select: { userId: true, status: true } })` must exist, and `hike.userId === user.id` OR `user.role === "admin"`. Reject otherwise.
4. Validate the supplied `fileAssetId` is eligible (`ensureEligibleTrackFileAsset`) and owned by the same user.
5. Slug uniqueness check.
6. `tx.track.create({ ..., fileAssetId, status: hikeStatus === "PUBLISHED" ? "PUBLISHED" : (status ?? "DRAFT") })`.
7. `tx.hikesToTracks.create({ hikeId, trackId })`.
8. Outside the transaction: `parseTrackGpx({ trackId })` (same call used by `TrackFormDialog`'s `handleCreateClick`).
9. Return `{ ok: true, trackId }`.

Failure codes map to localized toasts; the existing `getUploadDenialReason`/`getTrustGatedDenialReason` helpers are reused.

**Why colocate with `attachTrackToHike`:** both mutations are trip-side owner actions on `HikesToTracks`. Putting the new action in `app/_data/tracks/creation.ts` (the future feature-109 sibling) would split trip-side mutations across two data modules and force the page server component to import from both `hikes.ts` and `tracks/creation.ts`.

### 2. Capability helper: `getHikeTrackContributionCapability(hikeId)`

A new pure read helper colocated with `getPublicHike*` in `app/_data/hikes.ts`:

```
type HikeTrackContributionCapability = {
  hikeId: string;
  viewer: "anonymous" | "non-owner" | "owner-trust-ineligible" | "owner-quota-reached" | "owner-eligible";
  eligible: boolean;
  remainingTrackCount: number | null;   // null for non-eligible viewers
};
```

Behavior:

- Anonymous session → `{ viewer: "anonymous", eligible: false, remainingTrackCount: null }`.
- Authenticated user that is neither the trip's `userId` nor an admin → `{ viewer: "non-owner", eligible: false }`.
- Authenticated trip owner (or admin) without trust eligibility for `track-upload` → `{ viewer: "owner-trust-ineligible", eligible: false }`.
- Eligible owner with quota remaining → `{ viewer: "owner-eligible", eligible: true, remainingTrackCount: <n> }`.
- Eligible owner at quota cap → `{ viewer: "owner-quota-reached", eligible: false, remainingTrackCount: 0 }`.

The page server component (`app/(public)/hikes/[slug]/page.tsx`) calls this helper and passes the result into `HikeTrackContributionButton`. The button renders only for `eligible: true` (enabled) and `viewer: "owner-quota-reached"` (disabled with localized copy). It is omitted for `anonymous` / `non-owner` / `owner-trust-ineligible`.

### 3. Extract `TrackGpxUploadSection` from `TrackFormDialog`

A new client component `components/track-pages/track-gpx-upload-section.tsx` exports:

```
TrackGpxUploadSection({
  value,                       // { fileAssetId: string | null; fileAssetName: string | null }
  onChange,                    // (next: { fileAssetId; fileAssetName }) => void
  onParse,                     // () => void   — wired by parent to its own parse handler
  parsing,                     // boolean      — drives the spinner
  parseState,                  // same shape TrackFormDialog already uses
  uploadedFileAssetIds,        // string[]     — for the dirty-close guard
  onDiscardUploaded,           // (ids: string[]) => void  — parent decides where to send
  acceptGpxOnly: true,         // fixed
});
```

The component owns:

- `UploadDropzone` rendering and UploadThing route selection.
- Per-file validation messaging (`hasGpxFilename`, `hasAllowedGpxMimeType`, `validateGpxUploadMetadata`).
- The `fileAssetId` / `fileAssetName` `useWatch` plumbing currently inside `TrackFormDialog`.
- The `discardFileAssetIds` derivation (`uploadedFileAssetIds.filter(...)`) — but the actual `markDiscardedTrackGpxFileAssetsPendingDelete` call stays in the parent so the dirty-close confirm dialog stays in one place per consumer.

`TrackFormDialog` is rewritten to import `TrackGpxUploadSection` and remove the inline dropzone + watch logic. The dirty-close `Dialog`, `discardConfirmOpen`, and `markDiscardedTrackGpxFileAssetsPendingDelete` call stay in `TrackFormDialog` so the existing UX is preserved verbatim. `HikeTrackContributionDialog` does the same on its own state.

### 4. `HikeTrackContributionDialog` mirrors `HikePhotoContributionButton` shape

A new file `components/hike-pages/hike-track-contribution-form.tsx` exports `HikeTrackContributionButton` and `HikeTrackContributionDialog`:

```
HikeTrackContributionButton({ capability }) // renders Button + dialog, mirrors HikePhotoContributionButton
HikeTrackContributionDialog({
  open,
  onOpenChange,
  capability,
  ownerTracks,            // server-derived list of creator's unlinked tracks (with title + parse state)
  activityTypes,
  onAttached,             // () => void — fires after a successful attach or upload+attach
})
```

The dialog uses a small `Tabs` (or `RadioGroup`) to switch between the two sections. State held by the dialog:

- Selected section: `"attach" | "upload"`.
- For upload: form values (title, slug, description, status, recordingTimezone, activityTypeId) via `react-hook-form` + `zod`, the `fileAssetId` from the shared upload section, and the same dirty-close guard plumbing as `TrackFormDialog`.
- For attach: a `pendingTrackId` and the existing `attachTrackToHike` server action.

Submit handlers:

- Attach: `await attachTrackToHike({ hikeId: capability.hikeId, trackId })`.
- Upload: `await createTrackAndAttachToHike({ hikeId: capability.hikeId, ...trackFields, fileAssetId })`.

Both close the dialog on success and call `router.refresh()`. Both surface localized errors via `toast.error` while keeping the dialog open.

### 5. Mounting on the public trip detail page

`app/(public)/hikes/[slug]/page.tsx` already loads `getPublicHike` and a list of linked tracks. The page server component adds:

```
const [capability, ownerUnlinkedTracks, activityTypes] = await Promise.all([
  getHikeTrackContributionCapability(hike.id),
  capability.eligible ? getCreatorUnlinkedTracks(viewer.id) : Promise.resolve([]),
  getActiveTrackActivityTypes(),
]);
```

`getCreatorUnlinkedTracks(viewer.id)` is a new read helper in `app/_data/tracks.ts` that returns `Track[]` filtered to `userId = viewer.id` AND no `HikesToTracks` row, ordered by `updatedAt desc`. It is only called when `capability.eligible === true` to avoid leaking the user's track list to non-owner viewers.

The button is mounted inside the linked tracks card (or its parent), positioned similarly to `HikePhotoContributionButton` next to the photo gallery. The candidate already lists photo and track as parallel public surfaces, so the two buttons sit in their respective cards.

The page passes the capability result into the button component. For `viewer: "anonymous"`, the button is omitted entirely (the existing photo button handles its own anonymous state through a separate inline sign-in pattern; the track button is omitted to avoid two parallel sign-in prompts). For `viewer: "non-owner"` and `"owner-trust-ineligible"`, the button is omitted. For `"owner-quota-reached"`, the button is rendered disabled with the localized quota copy.

### 6. No schema changes

The `Track`, `FileAsset`, and `HikesToTracks` models already cover the new flow:
- `Track.fileAssetId` is required and points to a `FileAsset(purpose = TRACK_GPX)`.
- `HikesToTracks` is the existing join row.
- `Track.userId` and `Hike.userId` provide ownership.

The new flow simply writes the existing rows through a single transaction. No `TrackVisibility` or new enum is required.

## Risks / Trade-offs

- **[Risk] `TrackFormDialog` refactor could regress the existing upload UX** → Mitigation: extract is mechanical — move the JSX and `useWatch` plumbing into `TrackGpxUploadSection`, keep the dirty-close `Dialog` and the discard helper call in the parent; verify with `npm run build` and a manual browser smoke on `/admin/tracks` and `/my/tracks` before/after.
- **[Risk] Capability helper leaks track metadata to non-owner viewers** → Mitigation: only call `getCreatorUnlinkedTracks` when `capability.eligible === true`; for all other viewers pass an empty array. The capability itself returns no track titles.
- **[Risk] Slug race between upload-and-attach on the trip page and a parallel My tracks upload** → Mitigation: rely on the existing `Track.slug @unique` index; the transaction maps `P2002` to `{ ok: false, code: "SLUG" }` and the dialog surfaces it.
- **[Risk] Trip-page dialog stays open with unsaved uploads** → Mitigation: reuse the existing `markDiscardedTrackGpxFileAssetsPendingDelete` flow through the shared upload section, with the same confirm dialog used on `/my/tracks`.
- **[Risk] `getCreatorUnlinkedTracks` query grows unbounded for users with many tracks** → Mitigation: query selects only the minimum projection (`id`, `title`, `slug`, `updatedAt`, `parseState`) and orders by `updatedAt desc`; for now no pagination — the upload section is the primary path and the unlinked list is rarely long. Pagination is a deferred concern if any user ever hits performance issues.
- **[Risk] Administrator acting on behalf of the trip owner is not the actual `userId`** → Mitigation: the capability helper accepts the admin path through `user.role === "admin"`, but the new server action rejects admin-created rows when the trip's `userId` is not the admin (admins remain cross-user; for now this slice only allows the trip's actual creator). This matches the candidate's "verified or trusted trip creator" wording; an explicit admin override is deferred to a follow-up candidate.

## Migration Plan

1. Extract `TrackGpxUploadSection` from `TrackFormDialog`; verify `/admin/tracks` and `/my/tracks` upload UX is unchanged.
2. Add `createTrackAndAttachToHike`, `getHikeTrackContributionCapability`, and `getCreatorUnlinkedTracks` to the data layer; verify with a local-only script that exercises the happy path and at least the four rejection paths (trust, quota, slug, ineligible file asset).
3. Add `HikeTrackContributionButton` / `HikeTrackContributionDialog` and wire the page server component.
4. Localize new strings.
5. No DB migration is required. Deploy server, deploy client.

Rollback: revert the page wiring and remove the new components; keep `TrackGpxUploadSection` extraction in place because it is a pure refactor and reverts cleanly. The new server actions are unused after rollback and can be removed in the same revert.

## Open Questions

None. The four material decisions (audience scope, create flows, detach deferral, shared upload piece) were answered in the pre-proposal Q&A and are locked in by `proposal.md`. The remaining design choices (helper file paths, dialog layout, tab vs radio) are conventional for this codebase and can be made during implementation without changing scope.