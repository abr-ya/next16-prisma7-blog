# Workspace Access Policy (Access Matrix)

Status: active policy source for feature-073. Maintained with the workspace it
describes — update this file whenever a workspace route or action changes its
allowed actors. Sidebar visibility is **not** authorization; every rule below is
enforced server-side.

Actors: **V** anonymous visitor · **U** any signed-in account (including an
administrator) · **O** owner of the target resource (`userId` equals caller) ·
**P** accepted participant of the named trip · **A** account with the persisted
`admin` role (checked via `hasAdminRole`). `Allowed` is a union: for example,
`O, A` permits either the resource owner or an administrator. `O(photo)` names
the resource whose ownership is tested; it does not mean that the trip creator
is automatically the photo owner.

Required refusal convention: an anonymous route request redirects to
`/sign-in`; a signed-in actor outside the `Allowed` set redirects to `/`; both
happen before protected data renders. A server action outside its `Allowed` set
throws an authorization error, makes no mutation, and does not echo protected
content. Any implementation gap is listed under **Known deviations to close in
this change**. The legacy `/admin/hikes`
redirect is the sole routing exception: it exposes no protected data and its
destination applies the `/admin/trips` policy.

## Roles

- Active persisted roles: `user`, `admin` (`lib/auth-roles.ts`). Registration default: `user`.
- Deferred (unimplemented; keep out of code paths): `editor`, reputation-based
  quota tiers, bans, impersonation, organizations/teams, role-management UI.

## Routes (authenticated `/admin` shell)

| Route | Allowed | Scope predicate |
| --- | --- | --- |
| `/admin` (dashboard) | U | Own posts + own-category counts only |
| `/admin/posts` | U | Owner-scoped posts (`where userId`) |
| `/admin/posts/[id]` | O, A | Target post owned by caller, or administrator override |
| `/admin/categories` | U | Owner-scoped categories |
| `/admin/links` | U | Owner-scoped links |
| `/admin/md-docs`, `/admin/md-docs/[id]` | A | Global site content (no owner column) |
| `/admin/video-channels` | A | Global shared entities (no owner column) |
| `/admin/videos`, `/admin/videos/[id]` | U | Owner-scoped videos; global tags/channels are read-only reference data |
| `/admin/trips` | U | Own trips; the cross-user photo-option section renders only for A |
| `/admin/hikes` | — | Legacy `permanentRedirect` to `/admin/trips`; no protected data is rendered here |
| `/admin/tracks` | U | Owner-scoped tracks |
| `/admin/photos` | A | Cross-user photo management |
| `/admin/files` | A | Administrator-only file manager: all FileAsset records and lifecycle controls; usage cards show the current administrator's own quota statistics |
| `/admin/content-tags` | A | Tag governance |
| `/admin/database` | A | Backup contract surface |
| `/admin/saved-posts` | U | Placeholder, no data |

No middleware/proxy auth layer exists by design; guards live in layouts, pages,
helpers, and actions. `/admin` layout stays session-gated (personal workspace,
not an admin-only shell).

## Actions

### Posts, categories, links
| Action | Allowed | Rule |
| --- | --- | --- |
| `createPost` | U | Creates under caller's `userId` |
| `getPostById` (admin surface), `updatePost`, `deletePost` | O, A | Must verify post ownership before read/mutation; update must never reassign `userId` |
| `updatePostViews` | V | Intentional public view counter from blog pages (non-sensitive increment) |
| `connectLinkToPost` | O, A | Requires session; caller must own the post (admin override); link belongs to post owner |
| `createCategory` | U | Owns created category |
| `updateCategory` | O, A | Owner check against `category.userId` |
| `createLink` | U | Owns created link; short-code redirect lookup stays public |

### Tracks and trips
| Action | Allowed | Rule |
| --- | --- | --- |
| `createTrack` | U | Owns; GPX file asset linked by `ownerUserId` |
| `getTrackById`, `updateTrack`, `updateTrackRecordingTimezone`, `parseTrackGpx`, `deleteTrack` | O, A | `findFirst({ id, userId })` before mutate (present today) |
| `createHike` | U | Creates a trip under the caller's `userId` |
| `updateHike`, `deleteHike` | O, A | Target trip must belong to the caller, or administrator override applies |
| `attachTrackToHike`, `detachTrackFromHike`, `attachPhotoToHike`, `detachPhotoFromHike`, `reorderHikePhotos`, hike notes CRUD | A | Cross-user association/lifecycle = admin only (personal equivalents live in the public trip workflow) |
| `inviteHikeParticipant`, `cancelHikeInvitation`, `removeHikeParticipant` | O, A | `getHikeParticipantManager` (creator-or-admin) |
| `respondToHikeInvitation` | U (invitee) | Invitation `userId` must equal caller |
| `contributePhotoToHike` | P, O, A | Trip-scoped contribution only; file assets re-checked `ownerUserId` |
| `likeHikePhoto` / `unlike` | U | Own like row; published association only |

### Outdoor photos, coordinates, EXIF
| Action | Allowed | Rule |
| --- | --- | --- |
| Admin surface `listPhotos`, `createPhoto`, `updatePhoto`, `deletePhoto`, `refreshPhotoExifMetadata` | A | `getRequiredAdminUserId` (present today) |
| `refreshHikePhotoExifMetadata` (public trip surface) | O(photo), A | Photo owner or admin only (`lib/hike-photo-detail-policy.ts`); trip creator without photo ownership and accepted participants remain denied |
| `acceptHikePhotoTrackTimeMatchCandidate` (incl. manual coordinate), `rejectHikePhotoMapCoordinate`, `confirmHikePhotoCaptureTimezone` | O(photo), A | Same owner-or-admin predicate after confirming photo/trip linkage |

### Files
| Action | Allowed | Rule |
| --- | --- | --- |
| `markFileAssetPendingDelete`, `markDiscardedTrackGpxFileAssetsPendingDelete` | A | Lifecycle control (present today) |
| Download `app/files/[fileId]/download` | V/U/O/A | Existing visibility rules: PUBLIC/UNLISTED anyone; PRIVATE owner-or-admin; published hike photos any signed-in user |
| UploadThing `imageUploader` | U | Legacy route for rich-text image uploads; requires a real session. Full migration onto `fileUploader` is separate later work |
| UploadThing `fileUploader`, `trackGpxUploader`, `outdoorPhotoImageUploader` | U | Session required; quota tracked per owner |

### Governance and site controls
| Action | Allowed | Rule |
| --- | --- | --- |
| Md-doc CRUD | A | Global content; `requireAdminControl` enforces the administrator boundary |
| Video channel create/update/delete | A | Global shared entities; delete cascades videos |
| Content-tag rename/merge/review/migration | A | `requireAdmin` (present today) |
| `createLogEvent`, `logImageViewed` | U | Own-row writes only |
| Database backup handlers | A | Not implemented yet; surface is admin-gated |
| Role administration | A | Only via better-auth admin plugin under `/api/auth` |

## Reconciliation with existing OpenSpec specs

- `admin-auth-roles-structure`: comma-separated persisted roles, `user`/`admin` only — matrix matches; `editor` recorded as deferred above.
- `outdoor-photos` / hike photo detail: `canReviewCoordinate`/`canRefreshExif` = admin ∥ photo owner — matches this matrix and feature-073 spec scenarios (trip creator ≠ authority).
- `outdoor-trip-participants`: participation grants exactly `contributePhotoToHike` (and invitation response), no workspace or admin access — preserved.
- `files-admin` / `file-sharing-structure`: visibility-based download rules unchanged; admin lifecycle stays admin-only.
- Content-tags governance (`feature-055+` specs): admin-only — unchanged.

## Known deviations to close in this change

1. Closed (task 2.2): `updatePost` owner-or-admin check, no `userId` reassignment — `app/_data/posts.ts`.
2. Closed (task 2.2): `connectLinkToPost` requires session + post owner-or-admin + own-link rule — `app/_data/posts.ts`.
3. Closed (task 2.2): `getPostById` owner-or-admin on the admin surface — `app/_data/posts.ts`.
4. Closed (task 2.2): `updateCategory` owner-or-admin — `app/_data/categories.ts`.
5. Closed (task 2.4): `getAllLinks` session-gated and owner-scoped — `app/_data/links.ts`.
6. Closed (task 2.3): video-channel create/update/delete now `requireAdminControl`; `getVideoChannelById` has no repository consumers (dead code) and stays session-only.
7. Closed (task 2.3): md-docs create/update/delete/read-by-id require administrator control; public doc reads unchanged.
8. Closed (task 2.3): `assertOwnerOrAdminAccess` uses `hasAdminRole` — `app/_data/files.ts`.
9. Closed (task 2.3): legacy `imageUploader` requires a real session — `app/api/uploadthing/core.ts`.
10. Open (phase 3): sidebar shows admin-only destinations to non-admins; enforcement moves from helper-level redirects to consistent page/action guards with Personal/ Administrator navigation split.
11. Closed (task 2.4): dashboard/category reads are owner-scoped. `getAllContentTags` stays an ungated shared-vocabulary read (tag names are not per-user protected records; governance mutations remain admin-only).

## Unaudited (out of scope here)

Public read surfaces (blog, docs, public trips/videos), better-auth provider
flows under `/api/auth`, i18n/proxy layer, comment/link handling on public pages.
