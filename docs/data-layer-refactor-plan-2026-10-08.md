# Data layer refactor plan — 2026-10-08

## Context

While preparing stage 1 of feature-107 (`outdoor-public-trip-add-button`) we extracted shared trip form/dialog modules from `components/admin-pages/hikes-admin-panel.tsx` and added a new `getPublicTripCreationCapability()` projection to `app/_data/hikes.ts`. That file is now **2367 lines** and has been the natural landing place for every trip-side mutation since the project started.

Reviewing the rest of `app/_data/` shows several other data-accessor files that have either already grown past a comfortable reading size or are on the same trajectory:

| Lines | File | Status |
|---|---|---|
| 2367 | `hikes.ts` | actively grown; needs split now |
| 617  | `tracks.ts` | grown after feature-101/099; candidate |
| 388  | `photos.ts` | moderate; revisit on next photo feature |
| 378  | `files.ts` | moderate; one-off upload-thing work concentrated here |
| 360  | `videos.ts` | moderate; the video domain is more stable but still big |
| 302  | `posts.ts` | on the edge; revisit if a posts feature lands |
| 266  | `photo-comments.ts` | probably stays single file (small enough) |
| 243  | `video-bookmarks.ts` | single-purpose, probably stays |
| 205  | `video-channels.ts` | single-purpose, probably stays |

This doc records the plan to split `hikes.ts` first (pre-work for feature-107 stage 2 and the upcoming outdoor-track features) and the convention we want to follow so future splits of `tracks.ts`, `photos.ts`, etc. look the same.

The convention decision (collocated types in `app/_data/<scope>/types.ts` vs centralizing in `app/_interfaces/`) is recorded here because it is referenced every time another `_data` file is split.

## Goals / Non-Goals

**Goals:**

- Split `app/_data/hikes.ts` into focused submodules without changing any behavior.
- Establish the new layout as the convention for future `_data/<scope>` splits so every domain can follow the same shape.
- Keep the existing import path `@/app/_data/hikes` working everywhere it is consumed today.

**Non-Goals:**

- No behavior, schema, or trust/quota policy change.
- No extraction of shared helpers into a generic `lib/data/`; helpers stay inside the scope that owns them.
- No simultaneous rewrite of other `_data/*.ts` files in this change. They are listed below for follow-up consideration only.
- No public/UI change, no admin panel change.

## Convention decisions

### Collocated types, not `app/_interfaces/`

`app/_interfaces/` currently contains only `post.interface.ts` and `user.interface.ts` and neither is imported anywhere in the codebase. All recent data-accessor files (`hikes.ts`, `tracks.ts`, `photos.ts`, `comments.ts`, …) keep types inline at the top of the file.

Decision: follow the inline convention. New split files get types in `app/_data/<scope>/types.ts`, not in a resurrected `_interfaces/`. If a future cross-cutting type appears (e.g. `RichTextDocument`, `MediaItem`) we can revisit `_interfaces/` then.

### Folder shape for every split

```
app/_data/<scope>/
├── index.ts          # re-export everything for backward-compatible @/app/_data/<scope> imports
├── types.ts          # all entity-exported types
├── internal.ts       # private helpers (normalize*, getRequired*, ensure*, revalidate*, to* transformers)
├── queries.ts        # all read functions (public + admin projections)
└── mutations.ts       # all write functions (CRUD + associations + invitations + likes)
```

This shape works for `hikes` and is expected to be reusable for `tracks`, `photos`, `files`, `videos`, and `posts` whenever they reach the threshold.

### Import-path compatibility

Every existing consumer imports via `@/app/_data/hikes`. The split keeps that path alive by re-exporting every public symbol from `app/_data/hikes/index.ts`. Internal-only helpers (`internal.ts`) are not re-exported unless something else already depends on them.

## Plan for `hikes.ts`

### Current contents (by surface)

- Types (≈lines 69–509): `HikeActionValues`, `HikeTrackOption`, `HikePhotoOption`, `HikeListItem`, `HikeViewerStatus`, `PublicHikeListItem`, `PublicHike`, `HikeParticipantManagement`, `HikePhotoContributionCapability`, `HikePhotoLikeState`, `MyLikedHikePhoto`, `HikePhotoAcceptedCoordinate`, `HikePhotoDetail`, `PendingHikeInvitation`.
- Private helpers (≈lines 114–212, 365–808): `getRequiredUserId`, `getRequiredAdminUserId`, `normalize*`, `ensureSlugAvailable`, `hikeListInclude`, `publicHikeInclude`, `getStoredTrackRecordingStart`, `orderHikeTrackAssociations`, `to*`, `revalidateHikePaths`, `revalidateHikeTrackAssociationPaths`, `revalidateHikePhotoAssociationPaths`, `getHikeParticipantManager`, `expireHikeParticipantIfNeeded`.
- Reads (≈lines 872–1430): `getAllHikes`, `getHikePhotoOptions`, `getHikeById`, `acceptHikePhotoTrackTimeMatchCandidate`, `rejectHikePhotoMapCoordinate`, `confirmHikePhotoCaptureTimezone`, `refreshHikePhotoExifMetadata`, `getPublicHikes`, `getPublicHikeBySlug`, `getPublicTripCreationCapability`, `getPublicHikePhotoLikeStates`, `getMyLikedHikePhotos`, `isAcceptedHikeParticipant`, `getHikePhotoDetail`, `getHikePhotoContributionCapabilityBySlug`, `getHikeParticipantManagementBySlug`, `getPendingHikeInvitations`.
- Writes (≈lines 1519–2350): `likeHikePhoto`, `unlikeHikePhoto`, `contributePhotoToHike`, `inviteHikeParticipant`, `respondToHikeInvitation`, `cancelHikeInvitation`, `removeHikeParticipant`, `attachTrackToHike`, `detachTrackFromHike`, `attachPhotoToHike`, `detachPhotoFromHike`, `reorderHikePhotos`, `createHikeNote`, `updateHikeNote`, `deleteHikeNote`, `createHike`, `updateHike`, `deleteHike`.

### Target shape

```
app/_data/hikes/
├── index.ts          # re-export of every public symbol from types/queries/mutations
├── types.ts          # HikeActionValues, HikeListItem, PublicHike, … (move all types here)
├── internal.ts       # normalize*, getRequired*, ensureSlugAvailable, revalidate*, to*, hikeListInclude, publicHikeInclude, helpers used by ≥2 modules
├── queries.ts        # all read functions above
└── mutations.ts      # all write functions above
```

### Migration steps

1. Create `app/_data/hikes/{types,internal,queries,mutations}.ts` empty except for imports.
2. Move every type definition into `types.ts` (verbatim, no edits beyond import order).
3. Move private helpers into `internal.ts`. If a helper is only used by queries, it still lives in `internal.ts` to keep the boundary consistent; if it is only used by mutations, same rule. We do not split by usage to avoid two `internal` files.
4. Move every `export const`/`export function` into `queries.ts` or `mutations.ts`. Group by reading vs writing — a single function with a name that reads like a write goes in `mutations.ts`.
5. Add `app/_data/hikes/index.ts` that re-exports every public symbol so `import … from "@/app/_data/hikes"` continues to work. Internal helpers (`internal.ts`) are not re-exported.
6. Delete `app/_data/hikes.ts`.
7. Run `npm run tsc` and targeted ESLint. Resolve any circular-import errors by moving the shared dependency into `types.ts` or `internal.ts`.

### Risks

- **Circular imports.** `queries.ts` and `mutations.ts` both depend on `internal.ts`. `internal.ts` should not import from either. If `internal.ts` needs a type, import from `types.ts`. If `queries.ts` needs a write-side helper, it must come from `internal.ts` (not from `mutations.ts`).
- **Type leakage through `Prisma.*GetPayload<{include:…}>` includes** (`hikeListInclude`, `publicHikeInclude`). These define the shape returned by queries and consumed elsewhere. They live in `internal.ts` and `types.ts` together with the `HikeListItem`/`PublicHike` types they feed.
- **Untyped re-exports.** Avoid `export *` from `index.ts`; export each symbol by name so future type drift surfaces immediately.
- **Existing unused symbol removal.** `post.interface.ts` / `user.interface.ts` in `_interfaces/` are already dead; out of scope to delete them here.

## Open decisions

- **Timing on this branch.** Current proposal: land this as its own commit on the existing `feature-107-outdoor-public-trip-add-button` branch between stage 1 (already landed) and stage 2 (still pending). Stage 2 will then write new public-trip-creation helpers into `queries.ts` / `mutations.ts` directly. Alternative: defer to a separate feature branch and merge after 107. The first option keeps the feature flow linear; the second keeps the refactor diff isolated in its own PR.
- **Where to record this convention.** This doc captures the decision; no `CLAUDE.md` change needed unless we want future Claude sessions to discover it automatically.

## Other files to revisit later

These are the other `_data/*.ts` files that may need a similar split once they grow or if the right refactor opportunity arises. None of them are in scope for this change.

- `tracks.ts` (617 lines). After feature-108 (`outdoor-track-creation-public`) and feature-109 (`outdoor-track-point-deletion`) land, this file will likely need the same `types/queries/mutations/internal` split. Re-evaluate at that point.
- `photos.ts` (388 lines). Currently manageable. Revisit if a future photo feature crosses ~500 lines or when ownership/visibility work expands.
- `files.ts` (378 lines). One-off upload-thing work concentrated here; revisit when quota or visibility changes accumulate.
- `videos.ts` (360 lines). The video domain has been stable; revisit only when a video feature grows it.

For each of these, the same folder shape (`<scope>/{index,types,internal,queries,mutations}.ts`) and the same backward-compatibility rule (`@/app/_data/<scope>` continues to resolve) apply.

## Reference

- Research doc for outdoor-track features: [outdoor-tracks-feature-research-2026-10-07.md](./outdoor-tracks-feature-research-2026-10-07.md).
- Feature-107 stage 1 just landed: shared trip form/dialog modules extracted to `components/forms/trips/` and `components/dialogs/trips/`.