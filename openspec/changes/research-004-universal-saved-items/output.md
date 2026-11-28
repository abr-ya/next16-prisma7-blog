# research-004 — universal saved items: output

> Stage 1 of 4. This draft covers sections 2–4 of the required structure. Section 1 (executive summary) is written last and prepended, so the file intentionally starts at section 2.

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
