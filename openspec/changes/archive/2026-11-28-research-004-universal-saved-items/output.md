# research-004 — universal saved items: output

> Complete: sections 1–21 of the structure fixed in [`design.md`](./design.md). Written in four stages — the inventory (2–4), the carrier decision (5–8), the product surface (9–17), then the recommendation and the close (18–21). Every claim about current behavior cites the file that proves it.

## 1. Executive summary

The quick save should be **one generic table, `SavedItem`**, not a per-type table and not a kind of `Link`. It holds exactly what the owner asked for — a required title and URL, an optional note and one optional image — plus an owner, two timestamps, a type discriminator, and a persisted normalized key; everything else a type might need lives in `typeMeta` until it needs an index, and then in a subtype table ([§5](#5-carrier-options-considered), [§18](#18-recommendation-the-v1-slice-shape)).

The name is **`SavedItem`**, because "bookmark" is already taken in this schema by `VideoBookmark`, which is a timestamp inside a video rather than a saved link ([§7.2](#7-boundary-with-link-videobookmark-post-and-video)). The type is a **Prisma enum** (`GENERIC`, `VIDEO`), set from a suggestion the form preselects and the owner may override — the URL stays the source of truth ([§5.4](#54-type-storage-and-origin)).

The identity rule is a **persisted, namespaced key** (`youtube:<id>` or `url:<normalized>`) unique per owner, so a repeated capture updates nothing and reports "already saved", and a URL edit that would collide is refused rather than silently merged ([§11](#11-identity-the-persisted-key-and-dedupe)). The image is **one nullable `FileAsset` reference**, added after the capture rather than during it; a pasted image URL is rejected as a third-party render and an SSRF path ([§9](#9-minimal-capture-versus-the-per-type-detailed-form), [§10](#10-image-attachment-recommendation)).

The carrier is **private and carries no publication state** — `Video.visibility` and `Post.status` already hold that, and a second state would only drift ([§13](#13-publication-rights-and-moderation)). Promotion is a one-way copy into `Video` first, with `PRIVATE` forced and `videoDate` supplied by the owner ([§8](#8-promotion-paths-per-target)). The saved item's note is a **caption, not a note entity**, and the boundary against the future general `Note` is recorded for the `universal-note-entity` candidate ([§17](#17-boundary-with-notes-and-the-future-note-entity)).

Nothing is fetched from the network: the provider integration in this repository is pure URL parsing, and the recommendation keeps it that way until an allowlist and an SSRF boundary exist ([§12](#12-metadata-fetching-canonicalization-and-the-ssrf-boundary)). The plan is **capture → image → the video type → promotion → folders**, with the first slice being the owner's original idea on its own ([§19](#19-ordered-slice-plan)).

One defect surfaced on the way and belongs to the fixes pool: `createVideo` accepts `visibility: "PUBLIC"` from any signed-in session, and the admin area is guarded by `requireAuth`, not `requireAdmin` ([§13](#13-publication-rights-and-moderation), [§20](#20-risks-and-open-questions)).

## 2. Current capture surfaces inventory

### 2.1 `Link` — a published address, not a save

Fields ([`prisma/schema.prisma`](../../../prisma/schema.prisma), `model Link`): `name`, `description?`, `url`, `shortCode @unique`, `userId`, `createdAt`, `updatedAt`, plus the `LinksToPosts` join ([`model LinksToPosts`](../../../prisma/schema.prisma)). There is no note, no image, no status, and no draft/published split.

Behavior:

- `createLink` resolves the session and writes the row with a generated `shortCode` ([`app/_data/links.ts:6`](../../../app/_data/links.ts)); `getAllLinks` returns only the session owner's rows ([`app/_data/links.ts:30`](../../../app/_data/links.ts)).
- The creation helper checks **only a session**, not an admin role ([`app/_data/links.ts:6-21`](../../../app/_data/links.ts)).
- The admin page renders the table and the dialog with no role check ([`app/admin/links/page.tsx`](../../../app/admin/links/page.tsx)); the admin layout itself calls `requireAuth`, not `requireAdmin` ([`app/admin/layout.tsx:7-9`](../../../app/admin/layout.tsx)).
- The edit branch of the dialog is a `console.log` stub, so an owner cannot actually edit a link today ([`components/admin-pages/link-form.tsx:52-60`](../../../components/admin-pages/link-form.tsx)).
- `shortCode` is meant to be a public address (`LinkBlock` links to `/blog/links/<shortCode>`), but that page currently renders "This page is under reconstruction" ([`app/blog/links/[short]/page.tsx`](../../../app/blog/links/[short]/page.tsx)).

Conclusion: `Link` is the closest shape (name + URL + owner + timestamps) but it is **publication-first**: the identifier is a public address, and there is no note, image, lifecycle, or edit path. It is a promotion target, not the carrier.

### 2.2 `VideoBookmark` — a timeline marker inside one video

Fields ([`model VideoBookmark`](../../../prisma/schema.prisma)): `videoId`, `userId`, `timestampSeconds`, `label?`, `note?`, timestamps; indexes on `(userId, videoId, timestampSeconds)` and `videoId`.

- It cannot exist without a `Video` (`videoId` is required, cascade on delete).
- It is written through a session-only helper ([`app/_data/video-bookmarks.ts:66-72`](../../../app/_data/video-bookmarks.ts)).
- It carries no URL of its own.

Conclusion: "bookmark" already means a point in time inside a video. A general saved link cannot reuse the word in the schema without breaking that meaning; "saved item" is the available name.

### 2.3 `Video` — published content with provider metadata

Fields ([`model Video`](../../../prisma/schema.prisma)): `title`, `url`, `thumbnailUrl?`, `videoDate` (**required**), `visibility` (`PRIVATE` default), `provider?`, `providerVideoId?`, `embedUrl?`, `durationSeconds?`, `channelId?`, `userId`, tags, bookmarks, comments.

- `createVideo` resolves a plain session ([`app/_data/videos.ts:41-47`](../../../app/_data/videos.ts)), and accepts `visibility` with `PRIVATE` as the default ([`app/_data/videos.ts:218-243`](../../../app/_data/videos.ts)).
- The public feed reads only `visibility: "PUBLIC"` ([`app/_data/videos.ts:155`](../../../app/_data/videos.ts), [`app/_data/videos.ts:204-209`](../../../app/_data/videos.ts)).
- The admin videos page has no `requireAdmin` call.
- `videoDate` is mandatory and has no default, so a saved item cannot become a `Video` without either a date or a rule for one.

Conclusion: `Video` is the promotion target. Its required `videoDate` and its provider metadata are exactly what a quick save does not have.

### 2.4 `Post` and `PostImage`

`Post` ([`model Post`](../../../prisma/schema.prisma)): `title`, `slug @unique`, `content` (HTML), `imageUrl` (**required**), `views`, `tags String[]`, `status` (`PostStatus`, default `published`), `userId`, `categoryId?`.

`PostImage` ([`model PostImage`](../../../prisma/schema.prisma)): `url`, `fileKey?`, `userId?`, `postId?`, `createdAt`; nullable owner and parent, no `FileAsset` foreign key, no `visibility`, no order.

- `PostImage` is **derived from the post HTML**, not attached: `syncPostImages` deletes every row for the post and recreates them from `extractImagesFromContent(content)` on each save ([`app/_data/posts.ts:28-38`](../../../app/_data/posts.ts)).
- `createPost` and `updatePost` resolve a plain session ([`app/_data/posts.ts:99-101`](../../../app/_data/posts.ts), [`app/_data/posts.ts:134-136`](../../../app/_data/posts.ts)).

Conclusion: post images are a searchable shadow of embedded HTML, not an attachment model. Nothing here is reusable as the saved item's image reference.

### 2.5 `Photo`, `PhotoImage`, and `HikesToPhotos`

`Photo` ([`model Photo`](../../../prisma/schema.prisma)): `title`, `description?`, `status` (`DRAFT` / `PUBLISHED`, [`enum PhotoStatus`](../../../prisma/schema.prisma)), `metadata Json?`, `userId`, `images`, `hikes`, `likes`, `comments`.

- Creation and update resolve an **administrator** session: `getRequiredAdminUserId` calls `requireAdmin` ([`app/_data/photos.ts:40-44`](../../../app/_data/photos.ts)), and `createPhoto` uses it ([`app/_data/photos.ts:187`](../../../app/_data/photos.ts)). An ordinary owner cannot create a `Photo` today.
- `PhotoImage` ([`model PhotoImage`](../../../prisma/schema.prisma)): `fileAssetId @unique`, `sortOrder Int`, `@@unique([photoId, sortOrder])`. **One `FileAsset` belongs to at most one `PhotoImage`.**
- `HikesToPhotos` ([`model HikesToPhotos`](../../../prisma/schema.prisma)): composite primary key, `position Int`, `@@unique([hikeId, position])`. The same photo can sit in several hikes at different positions.

Conclusion: this is the only curated, ordered image set in the schema, but it is admin-owned, its status is a publication state, and its join forbids reusing one asset in two parents. It is a reference for ordering, not a base to extend for owner capture.

### 2.6 `FileAsset`

Fields ([`model FileAsset`](../../../prisma/schema.prisma)): `provider`, `fileKey @unique`, `customId?`, `url`, `name`, `mimeType`, `sizeBytes`, `purpose` ([`FileAssetPurpose`](../../../prisma/schema.prisma)), `visibility` (`PRIVATE` / `UNLISTED` / `PUBLIC`), `status` (`ACTIVE` / `DETACHED` / `PENDING_DELETE` / `DELETED`), `ownerUserId`, relations to `Track`, `Route`, `PhotoImage`, `TrackGeometry`, and `deletedAt`.

Upload routes ([`app/api/uploadthing/core.ts`](../../../app/api/uploadthing/core.ts)):

| Route | Limit | Creates `FileAsset` | Purpose / visibility |
| --- | --- | --- | --- |
| `imageUploader` | 1 MB, 1 file | **No** — logs only | — |
| `fileUploader` | general limits | Yes | `ADMIN_UPLOAD` default, `PRIVATE` default |
| `trackGpxUploader` | GPX limits, 1 file | Yes | `TRACK_GPX`, `PRIVATE` |
| `outdoorPhotoImageUploader` | photo limits | Yes | `OUTDOOR_PHOTO_IMAGE`, `PRIVATE` |

- `recordUploadThingFileAsset` defaults to `purpose: "ADMIN_UPLOAD"` and `visibility: "PRIVATE"`, and upserts by `fileKey` ([`app/_data/files.ts:188-213`](../../../app/_data/files.ts)).
- A storage quota already exists: `canUserUploadGeneralFiles` compares `storageUsedBytes` with `storageLimitBytes` ([`app/_data/files.ts:182-186`](../../../app/_data/files.ts)).
- There are **no derivatives and no dimensions**: the model has no width/height, and `getFileAssetForThumbnail` serves the original asset after an access check ([`app/_data/files.ts:319-345`](../../../app/_data/files.ts)).
- `next/image` allows only `utfs.io`, `lh3.googleusercontent.com`, and `i.ytimg.com` ([`next.config.ts:23-36`](../../../next.config.ts)).
- `PREVIEW_IMAGE` exists as a purpose value but is only rendered as a label in the files table ([`components/admin-pages/files-table.tsx:55`](../../../components/admin-pages/files-table.tsx)); no upload path assigns it.

### 2.7 Inventory summary

| Surface | Owner | Public address | Image | Ordering | Server guard |
| --- | --- | --- | --- | --- | --- |
| `Link` | session user | `shortCode` (page is a stub) | none | none | session only |
| `VideoBookmark` | session user | none | none | timestamp | session only |
| `Video` | session user | yes, when `PUBLIC` | thumbnail URL | feed order | session only |
| `Post` | session user | slug | `imageUrl` + derived `PostImage` | none | session only |
| `Photo` | **admin** | depends on `status` | `FileAsset` via `PhotoImage` | per photo and per hike | `requireAdmin` |
| `FileAsset` | session user | via `visibility` | itself | none | session + quota |

## 3. Personal-page and admin-panel reuse convention

The owner area is `/my/*`: `tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases` ([`app/(public)/my`](../../../app/(public)/my)). Every page follows the same shape:

- `export const dynamic = "force-dynamic"` and a `buildPageMetadata` call;
- `await requireAuth()` before any read;
- `PageLayout` with `contentWidth="wide"` ([`app/(public)/my/tracks/page.tsx:30-40`](../../../app/(public)/my/tracks/page.tsx));
- owner-scoped data helpers that resolve the session themselves, so the client never sends an owner id;
- reuse of the admin panels under `components/admin-pages` (`TrackManagementPanel`, `GearPanel`, `FavoritePlacesPanel`).

The user menu lists the same surfaces in `components/blog-pages/navbar-user-menu.tsx` (`dashboard`, `myTracks`, `myRoutes`, `myWorkouts`, `myGear`, `myPlaces`, `mySourceAliases`), so a `/my/saved` entry would slot in after `My places` or after `Source names`.

The admin area is **not uniformly admin-gated**. `app/admin/layout.tsx` calls only `requireAuth` ([`app/admin/layout.tsx:7-9`](../../../app/admin/layout.tsx)); role checks exist per page, and only some pages have them (`users`, `files`, `video-channels`, `database`, `track-activity-types`, and the photo actions). Links, videos, and posts are reachable and writable by any signed-in user through their pages and actions. This matters for the publication boundary: "admin-only" describes the navigation, not the server.

Implication for the carrier: a `/my/saved` page can follow the `/my` pattern exactly, but it needs a new panel — no existing admin panel manages a personal list of links. The admin links table is the wrong base because it renders `Link`, not saved items.

## 4. Image pipeline and what a saved item can reuse

What the saved item needs: at most one small image per record, owner-scoped, private by default, shown in a list and on a detail card.

What exists:

- `FileAsset` records an owner, a provider key, a URL, a MIME type, a size, a purpose, a visibility, a status, and timestamps. It is the only owner-scoped asset record.
- Three upload routes create `FileAsset` rows; `imageUploader` does not, so anything uploaded through it is absent from the asset registry.
- The general quota (`canUserUploadGeneralFiles`) already bounds per-user storage and is reused by three routes.
- `PREVIEW_IMAGE` is a declared purpose with no upload path, and reads naturally as "the small image of a record".

What is missing or unsuitable:

- **No derivatives.** There is no width, height, or thumbnail URL; the thumbnail route returns the original after an access check. A list of saved items that renders originals would pay full image weight per row unless the UI uses `next/image` resizing or a derivative is introduced.
- **Host allowlist.** `next/image` accepts three hosts. An UploadThing v7 `ufsUrl` host outside `utfs.io` would need a `remotePatterns` entry, or the card must render a plain `<img>`.
- **`Photo` / `PhotoImage` are not reusable as-is**: creation is admin-gated, `PhotoImage.fileAssetId` is unique, and `Photo` carries likes, comments, and a `DRAFT`/`PUBLISHED` status that a personal saved item does not need.
- **`PostImage` is not reusable**: no `FileAsset` relation, nullable owner and parent, and rows are recreated from HTML on every post save.

Conclusion: a saved item's image can only be a reference to `FileAsset`, uploaded through a route that records the asset and protected by the existing quota. The open decisions are the purpose value (`PREVIEW_IMAGE` reuse versus a new value), the reference shape (single `imageFileAssetId`, a join row, or a JSON id array), and whether derivatives are required before the list can show images at all. The first two belong to this research; the derivative work belongs to `outdoor-photo-albums-structure`.

### 4.5 Findings that constrain the later decisions

1. **No personal capture surface exists.** Every link-ish model is publication-first (`Link`), a publication target (`Video`, `Post`), a timeline marker (`VideoBookmark`), or admin-owned (`Photo`).
2. **"Admin-only" is a navigation convention, not a server gate** for links, videos, and posts; the carrier's publication boundary must rely on explicit checks, not on the surface it lives in.
3. **`Link` is the only model with a public address and it has no edit path** — `shortCode` is generated and the public page is a stub.
4. **One `FileAsset` can belong to at most one `PhotoImage`** (`@unique`), so a universal album/post attachment needs its own join.
5. **Ordering lives on the join row** (`PhotoImage.sortOrder`, `HikesToPhotos.position`), which is the pattern to copy for saved-item folders or future media attachments.
6. **The image pipeline has no derivatives and a three-host allowlist**, so "small image" is a UI/derivative decision, not a storage one that already exists.

### 4.6 Open questions carried into Stage 3

- Does the saved item carry a `status`/`visibility` from v1, and what does "published" mean for a carrier that is not itself a `Video` or a `Post`?
- Is the image part of the capture form at all, and does the carrier hold one id, a join row, or an array?
- How is the persisted normalized key built, and how do folders interact with its uniqueness?
- Does v1 fetch metadata at all, and if it does, through which allowlist and when?
- Where does the list live, and do folders and search arrive in the first slice?


## 5. Carrier options considered

Three shapes were evaluated against the same criteria: the cost of the second type, identity and dedupe, query ergonomics, ownership and visibility, how a per-type detailed form attaches, and how folders behave across types.

### 5.1 Option A — a table per type (`VideoCandidate`, later `ArticleCandidate`)

Each type owns a full table with its own title, URL, note, image, folder, owner, and timestamps.

- **Second type:** a new table, a new page and panel, a second copy of the capture and folder logic, and either a second folder table or a per-type membership column. The quick-save path is identical for every type, so this repeats the part that never varies.
- **Identity:** dedupe only inside one type; the same URL saved once as a video and once as a generic link is two rows with no rule joining them.
- **Queries:** typed and simple per type; listing "everything I saved" needs a union or a second page.
- **Form:** native columns, no JSON validation.
- **Verdict: skip.** It pays the carrier cost once per type for no type-specific benefit in the capture path.

### 5.2 Option B — one table with `type` and `typeMeta`

`SavedItem` holds the invariant fields (owner, title, url, normalized key, note, image reference, folder, timestamps) plus `type` and a nullable `typeMeta Json?` for per-type fields.

- **Second type:** a new value plus a Zod schema for `typeMeta`; no table, no second page, no second folder model.
- **Identity:** one row per `(owner, normalized key)` regardless of type; the type is a hint and can be corrected without splitting the row.
- **Queries:** list, search, and folder filters stay trivial; filtering or sorting *inside* `typeMeta` is the weak spot (JSON extraction, no Prisma-native index).
- **Form:** the minimal form always works; the detailed form switches its fields by `type` and validates `typeMeta` with a strict schema.
- **Risk:** untyped JSON drifts. Mitigate with a strict per-type schema at every write and read, and a `typeMeta` reset when the type changes.
- **Verdict: recommend for v1.**

### 5.3 Option C — one table plus a subtype table

`SavedItem` keeps the invariant fields; each type gets a subtype row (`SavedItemVideo` with provider, provider video id, duration, channel) keyed by `savedItemId`.

- **Second type:** a new subtype table and join, but the capture, folders, and dedupe stay shared.
- **Identity:** the same as B, with the provider identity additionally enforceable in the subtype.
- **Queries:** typed and indexable per type; joins are cheap at this scale.
- **Form:** the detailed form writes the subtype row; the minimal form still writes only the carrier.
- **Verdict: skip for v1, recommended as the upgrade path.** It adds a table before any type has a field worth indexing; B can move to C later by creating the subtype table and backfilling from `typeMeta` without touching the carrier rows.

### 5.4 Type storage and origin

**Storage — recommend a Prisma enum `SavedItemType` with `GENERIC` and `VIDEO`, non-null, default `GENERIC`.** The set is small and controlled by the product; the project already models closed sets as enums (`VideoVisibility`, `PhotoStatus`, `HikeNoteStatus`); adding a value is an additive `ALTER TYPE ... ADD VALUE`, not a breaking migration. The downside is real: a Postgres enum value is permanent, so a wrong type name cannot be removed, and the type set is not data-driven. If types ever become user- or plugin-defined, a validated `String` column is the fallback; that is not the current requirement.

**Origin — recommend the default plus a derived suggestion.** A plain capture stores `GENERIC` and never asks. When the URL host matches a known provider, the form preselects `VIDEO` as a suggestion; the owner can override it, and the server stores the submitted value after validation. This avoids the two failure modes of the alternatives: a forced manual choice slows the capture, and a silent server-side derivation stores a type the owner never saw. The existing `extractVideoProviderMetadata` ([`lib/video-providers/index.ts:6`](../../../lib/video-providers/index.ts)) already answers "is this a YouTube link", so the suggestion costs nothing new.

### 5.5 What `typeMeta` may hold in v1

`null` for `GENERIC`. For `VIDEO`, only what the detailed form edits and the list does not need to query: channel name, duration (once fetched), and the canonical provider id if it is not already a column. Anything the list filters or sorts on belongs in the carrier, not in JSON. The `typeMeta` schema is strict per type, so an unknown key is a validation error rather than silent storage.

## 6. Comparison matrix

| Criterion | A — table per type | B — `type` + `typeMeta` | C — carrier + subtype |
| --- | --- | --- | --- |
| Cost of the second type | New table, page, form, folder logic | New enum value + Zod schema | New subtype table + join |
| Identity / dedupe | Per type; cross-type duplicates | One row per normalized key | Same as B, plus subtype identity |
| Query ergonomics | Typed per type; cross-type listing needs a union | Trivial list; JSON for type fields | Typed joins; extra join per type |
| Ownership / visibility / status | Duplicated per table | One place | One place |
| Detailed form | Native columns | JSON validated by a strict schema | Typed subtype row |
| Folders | Per type or a polymorphic membership | One folder model | One folder model |
| Migration path | None across types | JSON to subtype when a field needs an index | Add a table per type |
| **Verdict** | **Skip** | **Recommend for v1** | **Skip for v1; the upgrade path** |

## 7. Boundary with `Link`, `VideoBookmark`, `Post`, and `Video`

| Model | Relation to the carrier | Why |
| --- | --- | --- |
| `Link` | Separate; a promotion target | Public `shortCode`, no note/image/status, no edit path |
| `VideoBookmark` | No relation | A timestamp inside one video, not a saved link |
| `Post` | Promotion target | Requires authored `content`, a unique `slug`, and an `imageUrl` |
| `Video` | Promotion target | Requires `videoDate`; provider metadata is derivable |
| `Photo` | No relation | Admin-owned published content, not a capture target |

**`Link` — separate, never a kind of `Link`.** The model's identifier is a public address (`shortCode`), its only guard is a session, and it has no note, image, lifecycle, or working edit path. Making the carrier a `Link` would force a public identifier and a public page onto every private quick save. The honest transition is a promotion: `title` to `name`, `note` to `description`, `url` to `url`, with `shortCode` generated at that moment.

**`VideoBookmark` — a different noun.** It cannot exist without a `Video` and carries no URL. Keeping both concepts under "bookmark" would make the schema ambiguous; "saved item" is the free name.

**`Post` and `Video` — promotion targets, not carriers.** Both require fields a capture does not have: `Post` needs authored HTML, a slug, and an image URL; `Video` needs a date. A saved item can seed either, but cannot be either without the owner filling the missing part. That missing part is exactly the "detailed form" the owner described.

## 8. Promotion paths per target

### 8.1 Into `Video`

| Step | Fields |
| --- | --- |
| Copied | `title` (or a fallback), `url` |
| Derived / re-fetched | `provider`, `providerVideoId`, `embedUrl`, `thumbnailUrl` via `getVideoMetadataData` ([`app/_data/videos.ts:59-79`](../../../app/_data/videos.ts)); `durationSeconds` is `null` today because the extractor returns `null` ([`lib/video-providers/youtube.ts:77`](../../../lib/video-providers/youtube.ts)) |
| Must be supplied | `videoDate` (required, no default), `visibility` (defaults to `PRIVATE`), optionally `channelId` and `tags` |
| Owner | The saved item's owner |

One blocker: the existing extractor handles `youtu.be`, `/watch`, `/shorts`, and `/embed`, but not `/live` ([`lib/video-providers/youtube.ts:37-45`](../../../lib/video-providers/youtube.ts)). Promoting a `/live` link today would store a `Video` with empty provider fields. Canonicalization must be extended or the promotion must refuse that URL before a video is created.

### 8.2 Into `Post`

| Step | Fields |
| --- | --- |
| Copied | `title`, `note` as the body seed, the image as the feature-image candidate |
| Derived | `slug` through `createSlug` |
| Must be supplied | `content` (authored HTML), `imageUrl` (required by the schema), optionally `categoryId` and tags |
| Status | `Post.status` defaults to `published` ([`prisma/schema.prisma:149`](../../../prisma/schema.prisma)); a promotion must force `draft` to avoid publishing an unfinished post |

### 8.3 Into `Link`

| Step | Fields |
| --- | --- |
| Copied | `title` to `name`, `note` to `description`, `url` to `url` |
| Derived | `shortCode` (generated by `createLink`, [`app/_data/links.ts:6-21`](../../../app/_data/links.ts)) |
| Must be supplied | Nothing structural |
| Gap | `Link` has no image and its edit path is a stub, so a promoted link cannot be corrected afterwards |

### 8.4 Reversibility, direction, and the one-to-many case

- **Recommend: the saved item survives promotion** and records the target. The target becomes the source of truth; later edits to the `Video`, `Post`, or `Link` do not flow back to the saved item, and the saved item is not deleted.
- A deleted target should null the reference (the promotion row disappears), so the saved item returns to the inbox rather than pointing at nothing.
- **Direction:** one saved item may promote into several targets (a post *and* a video from the same capture), so a single column on `SavedItem` cannot express the history. The shape is a `SavedItemPromotion(savedItemId, videoId?, postId?, linkId?, promotedAt)` join table with a constraint that exactly one target is set.
- **v1 shipping decision:** if v1 has no promotion slice (recommended — see the slice plan), ship **no promotion column at all**. A nullable `promotedVideoId` on the carrier is cheaper now but becomes the wrong shape at the first second target and needs a data move. Add the promotion table when the first promotion slice lands.
- **Rights:** only the owner may promote their own saved item; the resulting row is owned by the same `userId`. A trust or moderation gate for a public result is section 13.

## 9. Minimal capture versus the per-type detailed form

**The invariant fields — everything every type needs:** `title`, `url`, `note`, `imageFileAssetId`, `type`, the persisted normalized key, `userId`, `createdAt`, `updatedAt`.

**The type-specific fields — never on the carrier:** the provider identity, channel, and duration for `VIDEO`; whatever a future type needs. They live in `typeMeta` in v1 under a strict per-type schema ([§5.5](#55-what-typemeta-may-hold-in-v1)) and move to a subtype table when one of them must be indexed or referenced ([§5.3](#53-option-c--one-table-plus-a-subtype-table)).

The split rule is already stated in [§5.5](#55-what-typemeta-may-hold-in-v1) and it is the one that decides the next type's cost: **a value the list filters or sorts on belongs in a column; a value only the detailed form edits belongs in `typeMeta`.** Under that rule, `VIDEO` needs no carrier column at all — its provider fields are derived from the URL or fetched later, never typed by the owner.

### 9.1 The image is not part of the capture form

The owner asked for a *quick* save, and an upload is the slowest step in any capture. The recommendation:

- **The capture form is title + URL (+ optional note).** Nothing else, and in particular no upload.
- **The image is added afterwards**, from the item's detail view. The reusable upload control already exists — `ImageUploader` is a dropzone that takes an endpoint key ([`components/admin-pages/image-uploader.tsx:17-23`](../../../components/admin-pages/image-uploader.tsx)), so the image step is one dialog away, not a blocker in the capture path. A capture that needs an image can be saved now and completed later; the carrier's image field is nullable precisely so the item exists before its image does.
- **A `VIDEO` item needs no upload at all.** The provider thumbnail is *constructed* from the video id, not downloaded ([`lib/video-providers/youtube.ts:51-57`](../../../lib/video-providers/youtube.ts)), and `i.ytimg.com` is already an allowed `next/image` host ([`next.config.ts:23-36`](../../../next.config.ts)). The derived thumbnail is shown in the list and on the card; an owner-uploaded image overrides it.

This answers the second question of [§4.6](#46-open-questions-carried-into-stage-3): the image is not part of capture, and the carrier holds **one** id ([§10](#10-image-attachment-recommendation)).

## 10. Image attachment recommendation

**Recommend a single nullable `imageFileAssetId` on the carrier.** Verdict: `recommend`.

| Option | Verdict | Reason |
| --- | --- | --- |
| Single nullable FK `imageFileAssetId` | `recommend` | One column; the asset's owner, purpose, visibility, and status are already enforced by the asset model ([`model FileAsset`](../../../prisma/schema.prisma)); the list needs no extra join; `onDelete: SetNull` keeps the item when the asset is deleted |
| Join row (`SavedItemImage` with `sortOrder`) | `skip` for v1, keep as the escalation | The right shape for *several* images with ordering, and the precedent the repository has (`PhotoImage.sortOrder`, `@@unique([photoId, sortOrder])`, [`prisma/schema.prisma:650-661`](../../../prisma/schema.prisma)) — but it costs an extra table and an extra query for what is a 1:1 relationship in v1 |
| JSON array of `FileAsset` ids | `skip` | No foreign key, no `onDelete`, no referential integrity; Prisma cannot cascade it and a dangling id is invisible to the database |

**Migration path if a second image is ever needed:** create `SavedItemImage`, move the single id into one row with `sortOrder = 0`, drop `imageFileAssetId`. One additive migration plus one column drop, no data loss. The JSON array has no migration path at all, because there is no foreign key to convert.

### 10.1 A pasted image URL is rejected

It is not a cheaper upload — it is a different thing with two costs:

- **It renders a third-party URL.** The reader's IP reaches that host on every view, and a tracking pixel becomes a reader-side beacon. The saved item is a private page, but a promoted item is public, and the image would follow it there.
- **A server-side fetch of it is an SSRF path.** If the server ever fetched the pasted URL to copy the bytes into `FileAsset`, the fetch target would be attacker-controlled — `169.254.169.254`, internal hostnames, and the private ranges are all reachable from a field the owner fills in.

The repository has no arbitrary-URL fetch anywhere: the only provider integration is a pure string parser that returns empty metadata for an unknown host ([`lib/video-providers/index.ts:6-16`](../../../lib/video-providers/index.ts)), and every image enters through a typed upload route with a session check ([`app/api/uploadthing/core.ts`](../../../app/api/uploadthing/core.ts)). A pasted URL has no place in that pipeline, and the recording helper already exists to be reused ([`app/_data/files.ts:188-213`](../../../app/_data/files.ts)).

### 10.2 The upload route

Reuse `PREVIEW_IMAGE` as the asset purpose. It exists in `FileAssetPurpose` ([`prisma/schema.prisma:670-679`](../../../prisma/schema.prisma)), no upload path assigns it today ([`components/admin-pages/files-table.tsx:55`](../../../components/admin-pages/files-table.tsx)), and it already means "the small image of a record" — so no purpose value has to be added. The new route records the asset with `purpose: "PREVIEW_IMAGE"`, `visibility: PRIVATE`, owner = the session user, through `recordUploadThingFileAsset` ([`app/_data/files.ts:188-213`](../../../app/_data/files.ts)), and reuses the existing storage quota ([`app/_data/files.ts:182-186`](../../../app/_data/files.ts)).

The `imageUploader` route cannot be reused as-is: it logs the upload and creates no `FileAsset` row ([§2.6](#26-fileasset)), so an image saved through it would be absent from the asset registry.

### 10.3 The media-library deferral boundary

**Needed now, in this carrier:** one owner-scoped asset reference, one upload route, the `PREVIEW_IMAGE` purpose, the quota, and the thumbnail rule.

**Deferred to `outdoor-photo-albums-structure` ([`openspec/backlog.md`](../../backlog.md)):** the album entity, multi-image attachment, reuse of one asset across several parents (`PhotoImage.fileAssetId` is `@unique` with `onDelete: Restrict`, so one asset cannot sit in two places today — [`prisma/schema.prisma:650-661`](../../../prisma/schema.prisma)), derivatives and stored dimensions (`FileAsset` has no width or height — [`prisma/schema.prisma:694-720`](../../../prisma/schema.prisma)), asset publication, and orphan and garbage-collection rules.

The boundary is compatible by construction: the carrier adds **one** relation to `FileAsset`, and the album model will attach through its own join.

## 11. Identity, the persisted key, and dedupe

### 11.1 The key is persisted

The precedent is `TrackSourceAlias.rawKey` — a stored, normalized lookup key with `@@unique([userId, kind, rawKey])` ([`prisma/schema.prisma:566-580`](../../../prisma/schema.prisma)); its design states that the key is what makes case variants collide ([`archived design`](../archive/2026-11-25-feature-161-track-source-aliases-foundation/design.md)). The alias *write* path does not exist yet (the management candidate is still P1 — [`openspec/backlog.md`](../../backlog.md)), so the schema holds the precedent, not a running implementation. The saved item would be the first writer of a normalized key in this repository.

The carrier stores `normalizedKey String` and enforces `@@unique([userId, normalizedKey])`.

### 11.2 One namespaced column, not three columns

The key is polymorphic: a provider id for YouTube, a normalized URL otherwise. Two shapes were compared:

- **Namespaced single column** — `youtube:dQw4w9WgXcQ` / `url:example.com/article`. One `@@unique([userId, normalizedKey])`, expressible in the Prisma schema, self-describing, and the per-host-class rule is visible in the stored value.
- **Separate columns with partial unique indexes** — `provider`, `providerItemId`, `normalizedUrl`, each with `CREATE UNIQUE INDEX ... WHERE provider IS NOT NULL`. Prisma's schema language has no partial index, so this needs hand-written SQL in a migration, while the repository's migrations are Prisma-generated (a generated migration looks like [`prisma/migrations/20261113164652_add_favorite_places/migration.sql`](../../../prisma/migrations/20261113164652_add_favorite_places/migration.sql)). It also produces three nullable columns of which two are mutually exclusive, and every read must know which one is set.

**Recommend the namespaced single column.** Verdict: `recommend`. The failing criterion for the split-column option is expressibility: it cannot live in the schema, and a hand-written index Prisma does not know about becomes a second source of truth for a constraint.

### 11.3 Per-host-class normalization rules

- **YouTube class** (`youtube.com`, `m.youtube.com`, `youtu.be` — the allowlist already in the code, [`lib/video-providers/youtube.ts:7-13`](../../../lib/video-providers/youtube.ts)): key = `youtube:<videoId>`, the id parsed by `getYouTubeVideoId` ([`lib/video-providers/youtube.ts:25-49`](../../../lib/video-providers/youtube.ts)) from `/watch?v=`, `youtu.be/<id>`, `/shorts/<id>`, `/embed/<id>`, validated against `/^[A-Za-z0-9_-]{11}$/`. **`/live/<id>` is not handled by the current parser** ([`lib/video-providers/youtube.ts:37-45`](../../../lib/video-providers/youtube.ts)) — the same gap the promotion path already hit in [§8.1](#81-into-video). One branch in the parser closes it for both paths.
- **Generic class** (everything else): key = `url:` + the normalized URL, in this order — drop the scheme (`http` and `https` are the same resource for dedupe); lowercase the host; drop a leading `www.`; keep the path, dropping a trailing slash; drop the fragment; drop the query parameters `utm_*`, `si`, `fbclid`, `gclid`; keep the remaining query parameters in their original order (sorting them changes the meaning of some URLs); keep the path's case.

### 11.4 Dedupe rules

- **Scope: per owner.** `@@unique([userId, normalizedKey])`. Never global — the repository's only globally unique user content is the public addresses `Post.slug` and `Link.shortCode` ([`prisma/schema.prisma:726-738`](../../../prisma/schema.prisma)), which are publication identifiers, not private records.
- **Provider identity is the same rule, not a second rule.** For a YouTube link the key *is* the provider identity (`youtube:<id>`), so `(userId, provider, providerVideoId)` — the index that already exists on `Video` ([`prisma/schema.prisma:800`](../../../prisma/schema.prisma)) — is the YouTube case of the same constraint.
- **On a duplicate: one row, and the owner is told.** A repeated capture creates no second row and overwrites nothing: the write returns the existing item and the interface says "already saved" with a link to it. The existing title and note may have been edited by the owner, so silently overwriting them would lose work — the owner edits the existing item instead.
- **On a URL edit that collides: refuse.** The key is recomputed on every URL write, because it is persisted ([§11.1](#111-the-key-is-persisted)). If the recomputed key already belongs to another row of the same owner, the edit is **refused**, the error names the conflicting item, and the row keeps its previous URL and key. No silent merge, no duplicate row, no overwriting the other row's title.

### 11.5 Dedupe versus folders

The unique constraint and a per-folder row are incompatible. "One row per folder with duplicates allowed" would put the same link in the list N times, once per folder, and each copy would need its own key — the constraint would have to become `(userId, normalizedKey, folderId)`, which is no longer a dedupe constraint at all.

**Resolution: folders are a membership join, not a duplication.** One capture, many folders, through a `SavedItemFolder` join, using the ordering pattern the repository already puts on join rows (`PhotoImage.sortOrder`, `HikesToPhotos.position` — [`prisma/schema.prisma:636-661`](../../../prisma/schema.prisma)). The carrier's unique constraint is untouched, and a capture can sit in several folders without being copied.

## 12. Metadata fetching, canonicalization, and the SSRF boundary

**What exists today: no fetch at all.** The provider integration is pure string parsing — `extractYouTubeMetadata` builds `provider`, `providerVideoId`, `thumbnailUrl`, and `embedUrl` from the URL text ([`lib/video-providers/youtube.ts:67-79`](../../../lib/video-providers/youtube.ts)), `durationSeconds` is always `null` ([`lib/video-providers/metadata.ts:9-15`](../../../lib/video-providers/metadata.ts)), and `resolveAndSaveVideoThumbnail` *re-derives and stores* a thumbnail URL without downloading anything ([`app/_data/videos.ts:342-350`](../../../app/_data/videos.ts)). There is no HTTP client wrapper in the repository.

**Canonicalization.** For the YouTube class the canonical identity is the video id; a canonical URL could be reconstructed as `https://www.youtube.com/watch?v=<id>`, but v1 stores the URL exactly as typed — the owner recognizes the link they typed, and rewriting it changes what they see. The normalized key carries the canonical form instead ([§11.3](#113-per-host-class-normalization-rules)).

**The allowlist is the security boundary.** The rule the repository already follows: only known hosts are recognized, and everything else yields no provider data ([`lib/video-providers/youtube.ts:31-34`](../../../lib/video-providers/youtube.ts), [`lib/video-providers/index.ts:8-15`](../../../lib/video-providers/index.ts)). A fetch, if one is ever added, must satisfy **all** of: a fixed provider host taken from the allowlist (never a host taken from the user's URL), HTTPS only, a response size cap, redirects limited to the same allowlisted host, and execution outside the request path. No helper in the repository does this today, which is itself an argument against adding a fetch in v1.

| Option | Verdict | Reason |
| --- | --- | --- |
| Sync fetch on save | `skip` | A save would block on a third party; a slow provider becomes a broken capture, and the owner cannot tell a failed fetch from a failed save |
| Fetch at promotion time | `recommend` (deferred) | The promotion is an explicit one-off act where a failure is visible and the owner is present, and the derived provider fields are exactly what a promotion needs |
| Background fetch after save | `needs more research` | Needs a job runner; the repository has no job infrastructure. Missing measurement: whether the owner actually needs duration and channel — the parser leaves `durationSeconds` null and the video surfaces work without it |

**Recommend: v1 fetches nothing.** The carrier stores the URL as typed, the normalized key, and the type. Metadata enrichment is a deferred candidate whose precondition is the SSRF constraints above ([§19](#19-ordered-slice-plan), slice 6).

## 13. Publication, rights, and moderation

**The carrier carries no `status` and no `visibility` in v1.** Verdict: `recommend`. This answers the first question of [§4.6](#46-open-questions-carried-into-stage-3).

Publication state belongs to the target: `Video.visibility` with `PRIVATE` default ([`prisma/schema.prisma:782`](../../../prisma/schema.prisma)), `Post.status` with `published` default ([`prisma/schema.prisma:149`](../../../prisma/schema.prisma)), `Photo.status` ([`prisma/schema.prisma:607`](../../../prisma/schema.prisma)). A second publication state on the carrier would have to be kept in sync with the target's — and the promotion path is deliberately a one-way copy ([§8.4](#84-reversibility-direction-and-the-one-to-many-case)), so a synced status would drift the moment the owner edits the target.

"Published" for a carrier that is not a `Video` or a `Post` therefore has no meaning in v1: a saved item is private, and the thing that becomes public is the promotion target, carrying its own state. A promoted post must be forced to `draft` rather than inherit the schema default `published` ([§8.2](#82-into-post)).

**The carrier is private, always.** Every personal surface in this repository is owner-scoped by construction: `getOwnerSourceAliases` resolves the session itself and never takes an owner id from the client ([`app/_data/track-source-aliases.ts:22-26`](../../../app/_data/track-source-aliases.ts)), and `getAllLinks` returns only the session owner's rows ([`app/_data/links.ts:30`](../../../app/_data/links.ts)). The carrier follows the same rule: the client never sends an owner id, the data layer resolves the session.

**What a path into the public `/videos` feed would require.** The feed reads only `visibility: "PUBLIC"` ([`app/_data/videos.ts:155`](../../../app/_data/videos.ts), [`app/_data/videos.ts:204-209`](../../../app/_data/videos.ts)). The research recommends:

1. A promotion always creates the video as `PRIVATE`; publishing is a separate, explicit act on the video surface.
2. Making it public should require the trust level the repository already has — `UserTrustLevel`: `NEW`, `VERIFIED`, `TRUSTED`, `RESTRICTED` ([`prisma/schema.prisma:220-225`](../../../prisma/schema.prisma)) — with `assertVerifiedResourceQuota` as the implementation pattern ([`lib/auth-trust-quotas.server.ts:33-43`](../../../lib/auth-trust-quotas.server.ts)). A new quota key (`video`) would join `trip`, `photo`, `track` ([`lib/auth-trust-quotas.server.ts:9-13`](../../../lib/auth-trust-quotas.server.ts)).
3. `RESTRICTED` accounts cannot publish; an admin can always.

**The gap this research found.** `createVideo` accepts `visibility` from a plain session — the write path requires a session, not a role ([`app/_data/videos.ts:218-243`](../../../app/_data/videos.ts)) — and the admin area itself calls `requireAuth`, not `requireAdmin` ([`app/admin/layout.tsx:7-9`](../../../app/admin/layout.tsx)). Today any signed-in user can therefore create a `PUBLIC` video, and "the admin page" is a navigation convention rather than a server gate ([§3](#3-personal-page-and-admin-panel-reuse-convention)). The carrier's promotion path must not inherit that: promotion defaults to `PRIVATE`, and the public step is explicit and trust-gated. The gap itself is a separate defect and belongs in the fixes pool ([§20](#20-risks-and-open-questions), risk 1).

**Rights.** A capture is private, so no rights question arises at capture time. The rights question arises at promotion, when a public video reproduces the provider's content and a public post reproduces the author's — both are the existing publication surfaces' questions, not the carrier's. The carrier needs no rights field.

## 14. Page placement, navigation, and search

**Placement: `/my/saved`.** The personal area already has six surfaces — `tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases` ([`app/(public)/my`](../../../app/(public)/my)) — and the new page follows the same four lines: `export const dynamic = "force-dynamic"`, `buildPageMetadata`, `await requireAuth()` before any read, and `PageLayout` with `contentWidth="wide"` ([`app/(public)/my/tracks/page.tsx:30-40`](../../../app/(public)/my/tracks/page.tsx)).

**The closest existing precedent is not an admin panel — it is `FavoritePlacesPanel`.** That panel (feature-148) is the repository's own owner-scoped list: it reads the list from props, owns the create/rename dialog and the delete confirmation, and leaves the owner scoping to the data layer ([`components/admin-pages/favorite-places-panel.tsx:14-16`](../../../components/admin-pages/favorite-places-panel.tsx)). The saved-items panel should copy that shape and the three-file layout around it — panel, columns, form dialog (`favorite-places-panel.tsx`, `favorite-place-columns.tsx`, `favorite-place-form-dialog.tsx`).

The admin links table is the wrong base: it renders `Link`, not saved items ([`app/admin/links/page.tsx`](../../../app/admin/links/page.tsx)), and a `Link` has no note, image, or type ([§2.1](#21-link--a-published-address-not-a-save)).

**Navigation.** The user menu is the entry point ([`components/blog-pages/navbar-user-menu.tsx:80-116`](../../../components/blog-pages/navbar-user-menu.tsx)): `dashboard`, `myTracks`, `myRoutes`, `myWorkouts`, `myGear`, `myPlaces`, `mySourceAliases`. **Saved** goes after **My places**, grouping the two "my own things" surfaces together, and the label needs an entry in both locale files ([`app/i18n/locales/en/navigation.json:18-26`](../../../app/i18n/locales/en/navigation.json)) plus the workspace namespace, as the source-names page did.

**Search: not in v1.** The repository has exactly one text search — the admin users directory — and it is a `contains` with `mode: "insensitive"` on a single column ([`app/_data/users.ts:33-40`](../../../app/_data/users.ts)); the public videos feed filters by channel, sort, and page, not by text ([`app/(public)/videos/page.tsx:30-36`](../../../app/(public)/videos/page.tsx)). A personal list of tens of items does not need search; the list is ordered by `createdAt desc` and paginated.

**Indexes for v1.** `@@unique([userId, normalizedKey])` for dedupe, `@@index([userId, createdAt])` for the ordered list, `@@index([userId, type])` for a type filter. The owner-scoped index is the repository's own pattern ([`model FavoritePlace`](../../../prisma/schema.prisma), [`model Gear`](../../../prisma/schema.prisma)).

**When search arrives.** A `contains` filter over title, url, and note is a per-owner sequential scan; it is fine for hundreds of rows and painful for tens of thousands. Beyond that, a trigram index (`pg_trgm` + GIN) is the right tool — and Prisma's schema language cannot express it, so it would need a hand-written migration, the same caveat as [§11.2](#112-one-namespaced-column-not-three-columns) and [§16](#16-promotion-mechanics-when-the-promotion-slice-lands).

## 15. Folders, tags, and bulk behavior

**Folders: flat, one level, and not in the first slice.** Verdict: `skip` for v1; the design below is what a later slice should follow.

- *Flat.* The repository has no nested-collection precedent; the only parent/child structure is route composition (`RouteSegmentRole`, [`prisma/schema.prisma:358`](../../../prisma/schema.prisma)), which composes GPX, not organization. Nested folders need a path column or a closure table plus a move operation — a second-order problem for a personal list.
- *Membership, not duplication* ([§11.5](#115-dedupe-versus-folders)). One capture, many folders, through a join row with the ordering pattern the repository already uses.
- *No virtual Inbox in v1.* An Inbox is a view over "no folder membership", which only means something once folders exist; in v1 the whole list is the inbox.
- *Counts* are per folder (`COUNT(*)` grouped by folder) and are worth building only with folders.

**Tags: not in v1, and reuse an existing tag table when they come.** The repository has two tag systems already — `ContentTag` + `PostsToContentTags` for posts ([`prisma/schema.prisma:162-183`](../../../prisma/schema.prisma)) and `VideoTag` + `VideosToVideoTags` for videos ([`prisma/schema.prisma:804-824`](../../../prisma/schema.prisma)) — plus a `Post.tags String[]` array on the row ([`prisma/schema.prisma:148`](../../../prisma/schema.prisma)). Two precedents that disagree; a new model must pick one, and the join-table style is the one that can be reused across types. Nothing about the carrier depends on this decision.

**Bulk actions: not in v1.** The only row-level pattern is the shared delete confirmation hook ([`lib/use-delete-row-confirm.ts`](../../../lib/use-delete-row-confirm.ts)), which the owner-scoped panels already use ([`components/admin-pages/favorite-places-panel.tsx:28-41`](../../../components/admin-pages/favorite-places-panel.tsx)). Bulk select needs a stable id set, a selection model, and a confirmation; none of that exists, and a saved item is cheap to delete one by one. Bulk "move to folder" belongs with folders; bulk delete belongs with that slice, not with capture.

## 16. Promotion mechanics when the promotion slice lands

[§8.4](#84-reversibility-direction-and-the-one-to-many-case) decides the shape; this section states what the schema can and cannot enforce.

**v1 ships no promotion column and no promotion table.** The carrier has no promotion reference at all, so the "one saved item → several targets" problem does not exist yet.

**When the slice lands, the three optional relations are real foreign keys.** `SavedItemPromotion` can declare `video Video? @relation(..., onDelete: Cascade)`, `post Post? @relation(..., onDelete: Cascade)`, and `link Link? @relation(..., onDelete: Cascade)` beside `savedItem SavedItem @relation(..., onDelete: Cascade)`. The "a deleted target nulls the reference" requirement of [§8.4](#84-reversibility-direction-and-the-one-to-many-case) is then satisfied by the database: the cascade deletes the promotion row, and the saved item returns to the list without pointing at anything. No application cleanup and no dangling pointer.

**The "exactly one target" rule is not expressible in the Prisma schema.** Three nullable columns allow a row with no target or with two. The rule therefore has to live in the application — strict validation at write time, the same discipline `typeMeta` already requires ([§5.5](#55-what-typemeta-may-hold-in-v1)) — and, if a database guarantee is wanted, in a hand-written `CHECK (num_nonnulls(...) = 1)` in the migration. A constraint written by hand is invisible to `prisma migrate diff` and to `prisma migrate dev`, which is the same second-source-of-truth caveat as the partial unique index in [§11.2](#112-one-namespaced-column-not-three-columns).

**Direction and sync.** The saved item records the promotion; the target is the source of truth; later edits to the target do not flow back, and the saved item is not deleted. Un-promoting is deleting the promotion row.

## 17. Boundary with notes and the future `Note` entity

**The saved item's `note` is a caption, not a note entity.** It is a plain text column on the carrier row: no identity of its own, no coordinates, no day key, no lifecycle, no sharing, and it disappears with its capture. That is what a caption is.

**What already exists is not a general note.**

- `HikeNote` is hike-scoped: `hikeId` is required, and the row carries `latitude`, `longitude`, `dayKey`, and a `status` ([`prisma/schema.prisma:338-353`](../../../prisma/schema.prisma)). It is a fragment of a hike log, positioned in space and time inside one hike.
- `Track.privateNote` is a plain optional string on the track ([`prisma/schema.prisma:455`](../../../prisma/schema.prisma)).

**A future general `Note` would absorb those two, not the capture's caption.** A general note has its own identity, its own owner, and its own lifecycle; `HikeNote` is the obvious candidate to be absorbed into it — its `dayKey` and coordinates are exactly the attributes a general note would carry — and `Track.privateNote` is the second. The capture's caption is not on that list: it is an attribute of the thing it describes, the way a post's description is an attribute of the post.

**The rule that keeps the two apart:** the capture's `note` stays a column on the capture row; a `Note` entity that later wants to reference a capture is a separate row that points at it, and it must not replace the column. The `universal-note-entity` candidate in the research backlog ([`openspec/research-backlog.md`](../../research-backlog.md)) tracks that question, and this is the boundary it inherits: **a note entity may attach to a capture; a capture's caption is not a note entity.**

## 18. Recommendation: the v1 slice shape

One generic table, one owner, one key, one list.

```prisma
enum SavedItemType {
  GENERIC
  VIDEO
}

model SavedItem {
  id               String        @id @default(uuid())
  title            String
  url              String
  note             String?
  normalizedKey    String
  type             SavedItemType @default(GENERIC)
  typeMeta         Json?
  imageFileAssetId String?
  imageFileAsset   FileAsset?    @relation(fields: [imageFileAssetId], references: [id], onDelete: SetNull)
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@unique([userId, normalizedKey])
  @@index([userId, createdAt])
  @@index([userId, type])
}
```

with the two back-relations it needs (`User.savedItems`, `FileAsset.savedItems`). There is no folder column: one row, many folders, through a membership join when folders arrive ([§11.5](#115-dedupe-versus-folders)), and no promotion reference until the promotion slice lands ([§8.4](#84-reversibility-direction-and-the-one-to-many-case)).

| Decision | v1 answer | Where |
| --- | --- | --- |
| Carrier | one generic table, `type` + `typeMeta` | [§5](#5-carrier-options-considered) |
| Type storage | Prisma enum `SavedItemType` (`GENERIC`, `VIDEO`), default `GENERIC` | [§5.4](#54-type-storage-and-origin) |
| Type origin | the form preselects a derived suggestion; the owner may override; the server stores what was submitted | [§5.4](#54-type-storage-and-origin) |
| Type payload | strict per-type Zod schema in `typeMeta`; reset when the type changes | [§5.5](#55-what-typemeta-may-hold-in-v1) |
| Identity | persisted `normalizedKey`, unique per owner | [§11](#11-identity-the-persisted-key-and-dedupe) |
| Key shape | one namespaced column (`youtube:<id>` / `url:<normalized>`) | [§11.2](#112-one-namespaced-column-not-three-columns) |
| Duplicate capture | no second row; "already saved" with a link to the existing item | [§11.4](#114-dedupe-rules) |
| URL edit | the key is recomputed; a collision refuses the edit | [§11.4](#114-dedupe-rules) |
| Image | one nullable `imageFileAssetId`; not part of capture | [§10](#10-image-attachment-recommendation) |
| Publication | none on the carrier — it is private, and the target carries the state | [§13](#13-publication-rights-and-moderation) |
| Promotion | none in the first slice; the table arrives with the first promotion slice | [§8.4](#84-reversibility-direction-and-the-one-to-many-case) |
| Folders, tags, bulk | none in the first slice | [§15](#15-folders-tags-and-bulk-behavior) |
| Search | none in the first slice | [§14](#14-page-placement-navigation-and-search) |
| Metadata fetch | none; the URL is parsed, never fetched | [§12](#12-metadata-fetching-canonicalization-and-the-ssrf-boundary) |

The escalation points are already named: a subtype table when a type needs an indexed or referenced field ([§5.3](#53-option-c--one-table-plus-a-subtype-table)), a folder join when folders arrive ([§11.5](#115-dedupe-versus-folders)), a promotion table when promotion lands ([§16](#16-promotion-mechanics-when-the-promotion-slice-lands)), and a fetch only behind an allowlist ([§12](#12-metadata-fetching-canonicalization-and-the-ssrf-boundary)).

## 19. Ordered slice plan

**Slice 1 — the personal capture.** The schema above; the key module (`lib/saved-item-key.ts`, following the `lib/video-providers/` pattern) with the per-host-class rules; the owner-scoped data layer; the `/my/saved` page; the panel trio (panel, columns, form dialog); the capture form (title + URL + optional note); the "already saved" response; the user-menu entry and both locale files. *No dependencies.* This slice alone is the owner's idea: four parameters, two timestamps, an owner.

**Slice 2 — the image.** The upload route that records a `FileAsset` with `purpose: "PREVIEW_IMAGE"` and `visibility: PRIVATE`; the detail-view image control reusing `ImageUploader`; the derived provider thumbnail for `VIDEO` items; the owner image overriding it. *Depends on slice 1.*

**Slice 3 — the video type.** The type preselection from the URL host; the strict `typeMeta` schema per type; the per-type detailed form; the `/live` branch in the YouTube parser; the decision to keep the provider fields in `typeMeta` until something needs an index. *Depends on slices 1 and 2.*

**Slice 4 — promotion into `Video`.** The `SavedItemPromotion` table with its three optional cascades; the promotion dialog; `visibility` forced to `PRIVATE`; `videoDate` defaulting to the capture's date and editable; the promoted state on the saved item; the cascade that removes the promotion row when the target is deleted. *Depends on slice 3.*

**Slice 5 — folders, tags, bulk.** Flat folders and the membership join; counts per folder; bulk move and delete; tags through the existing tag tables. *Depends on slices 1 and 4* — a folder should be able to hold a promoted item, so the folder model has to know the promotion shape.

**Slice 6 — metadata fetch.** The provider allowlist fetch for duration, channel, and title; the SSRF constraints of [§12](#12-metadata-fetching-canonicalization-and-the-ssrf-boundary); background execution. *Depends on a job runner and on the fetch boundary* — this is the slice most likely to stay deferred.

**Slice 7 — publishing a capture.** A public saved-items list, or a trust-gated path from a capture to a public video. *Depends on the account-trust work and on the fix in risk 1 below.*

**The v1 cut line:** slices 1–3 are the feature; slices 4–7 are separate candidates, filed when slice 3 ships.

## 20. Risks and open questions

### Risks

1. **The publication gate is open today.** `createVideo` accepts `visibility: "PUBLIC"` from any signed-in session, and the admin area calls `requireAuth`, not `requireAdmin` ([§13](#13-publication-rights-and-moderation)). The carrier's promotion path must not widen this, and the gap itself is a defect worth its own fix candidate — the guard that belongs in front of a public video is the trust level, not the page a form lives on.
2. **`next/image` accepts three hosts** ([`next.config.ts:23-36`](../../../next.config.ts)). The derived YouTube thumbnail is covered (`i.ytimg.com`); an UploadThing v7 host may not be, in which case the card needs a `remotePatterns` entry or a plain `<img>`.
3. **No derivatives.** `FileAsset` stores no dimensions ([`prisma/schema.prisma:694-720`](../../../prisma/schema.prisma)), and the thumbnail route serves the original ([`app/_data/files.ts:319-345`](../../../app/_data/files.ts)). A list of owner-uploaded images renders originals; `next/image` resizing mitigates the transfer, not the storage.
4. **`/live` YouTube URLs are unparsed** ([`lib/video-providers/youtube.ts:37-45`](../../../lib/video-providers/youtube.ts)). Until the parser gains that branch, a live link is `GENERIC` with a `url:` key and a video promotion would store empty provider fields ([§8.1](#81-into-video)).
5. **`typeMeta` drifts.** The strict per-type schema is the only guard; a type change must reset the payload, or stale keys from the previous type survive.
6. **The type is a hint.** A wrong type is possible by design, and the preselected suggestion is the main path to a wrong one — the owner overrides it in the same form, so the correction costs one click.
7. **The enum is permanent.** A retired type value stays in the database ([§5.4](#54-type-storage-and-origin)); the fallback to a validated string column stays available.
8. **Hand-written SQL is a second source of truth.** Partial unique indexes ([§11.2](#112-one-namespaced-column-not-three-columns)), the promotion CHECK constraint ([§16](#16-promotion-mechanics-when-the-promotion-slice-lands)), and a future trigram index ([§14](#14-page-placement-navigation-and-search)) are all invisible to `prisma migrate diff`. Keep them to the minimum, and record them next to the migration.
9. **Folders are deferred.** If the list grows quickly, a flat newest-first list becomes unusable — the folders candidate must be filed with the feature, not remembered.
10. **Two link registries.** The carrier and `Link` will both hold URLs; the boundary that keeps them apart is that `Link` is public and `SavedItem` is private ([§7.1](#7-boundary-with-link-videobookmark-post-and-video)).

### Open questions for the owner

1. Is the **title mandatory**, or may it be derived from the URL when the owner types none? The proposal makes it mandatory; the recommendation is to keep it mandatory.
2. Is the **note plain text or rich text**? The recommendation is plain text, matching `Track.privateNote` ([`prisma/schema.prisma:455`](../../../prisma/schema.prisma)).
3. On a **duplicate capture**, should the form open the existing item for editing, or report "already saved" and link to it? The recommendation is the latter.
4. Should the **type preselection** be visible in the capture form at all, or appear only in the detailed form? The recommendation is the preselection, because the alternative is a silent server-side derivation the owner never saw ([§5.4](#54-type-storage-and-origin)).
5. Should a **promotion into `Video`** be able to set `PUBLIC` directly? The recommendation is no — promotion is `PRIVATE`, and publishing is a separate trust-gated act ([§13](#13-publication-rights-and-moderation)).
6. Do **folders** come before or after promotion? The recommendation is after ([§19](#19-ordered-slice-plan)).

## 21. Evidence

Every claim above was checked against the repository. The files that carry the proof:

**Data model** — [`prisma/schema.prisma`](../../../prisma/schema.prisma): `Link` 726-738 and `LinksToPosts` 740-748 (public `shortCode`, no note/image/status); `VideoBookmark` 826-840 (timestamp inside a video); `Video` 776-802 (required `videoDate`, `visibility` default `PRIVATE`, `provider`/`providerVideoId` as free strings, `@@index([provider, providerVideoId])`); `Post` 141-160 (required `content`, `imageUrl`, `slug @unique`, `tags String[]`); `PostImage` 186-198 (raw url + fileKey, nullable owner); `Photo` 603-621 (admin-owned, `metadata Json?`, `DRAFT`/`PUBLISHED`); `PhotoImage` 650-661 (`fileAssetId @unique`, `onDelete: Restrict`, `@@unique([photoId, sortOrder])`); `HikesToPhotos` 636-648 (ordering on the join); `FileAsset` 694-720 (owner, purpose, visibility, status, no dimensions); `HikeNote` 338-353 (hike-scoped, coordinates, `dayKey`); `Track.privateNote` 455; `FavoritePlace` 423-433 and `Gear` 517-531 (owner-scoped list precedent); `TrackSourceAlias` 566-580 (persisted `rawKey`, `@@unique([userId, kind, rawKey])`); `User` (`role`, `trustLevel`, `banned`); enums `PostStatus` 210, `UserTrustLevel` 220, `PhotoStatus` 267, `HikeNoteStatus` 272, `RouteSegmentRole` 358, `TrackSourceAliasKind` 561, `FileAssetPurpose` 670, `FileAssetVisibility` 681, `FileAssetStatus` 687, `VideoVisibility` 753; `VideoTag`/`VideosToVideoTags` 804-824 and `ContentTag`/`PostsToContentTags` 162-183 (two tag systems).

**Data layer** — `app/_data/links.ts` (`createLink` 6-21, `getAllLinks` 30); `app/_data/videos.ts` (`getVideoMetadataData` 58-74, public feed 155 and 204-209, `createVideo` 218-243, `resolveAndSaveVideoThumbnail` 342-350); `app/_data/posts.ts` (`syncPostImages` 28-38, `createPost` 99-101, `updatePost` 134-136); `app/_data/photos.ts` (`getRequiredAdminUserId` 40-44, `createPhoto` 187); `app/_data/files.ts` (quota 182-186, `recordUploadThingFileAsset` 188-213, thumbnail access 319-345); `app/_data/track-source-aliases.ts` 22-26; `app/_data/users.ts` 33-40; `app/_data/video-bookmarks.ts` 66-72.

**Library** — `lib/video-providers/youtube.ts` (host allowlist 7-13, id parser 25-49, thumbnail 51-57, embed 59-65, metadata 67-79); `lib/video-providers/index.ts` 6-16; `lib/video-providers/metadata.ts` 9-15; `lib/auth-trust.ts` 16-20; `lib/auth-trust-quotas.server.ts` 9-13 and 33-43; `lib/use-delete-row-confirm.ts`; `lib/slug-generator.ts`.

**Interface** — `components/admin-pages/link-form.tsx` (Zod schema 25-31, edit stub 52-60); `components/admin-pages/files-table.tsx` 55; `components/admin-pages/favorite-places-panel.tsx` 14-16 and 28-41; `components/admin-pages/image-uploader.tsx` 17-23; `components/blog-pages/navbar-user-menu.tsx` 80-116.

**Routes and pages** — `app/api/uploadthing/core.ts` (four upload routes); `app/admin/layout.tsx` 7-9; `app/admin/links/page.tsx`; `app/admin/users/page.tsx` 13-40; `app/(public)/my/*` (six personal pages); `app/(public)/my/tracks/page.tsx` 30-40; `app/(public)/videos/page.tsx` 30-36; `app/blog/links/[short]/page.tsx`; `app/i18n/locales/{en,ru}/navigation.json`; `next.config.ts` 23-36.

**Build and migrations** — `package.json` (zod 4.3.4); `prisma/migrations/20261113164652_add_favorite_places/migration.sql` (the shape of a generated migration); `prisma/migrations/20261125120000_feature_161_track_source_aliases/migration.sql` (the unique index on the normalized key).
