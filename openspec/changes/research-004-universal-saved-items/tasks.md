# Tasks

## 1. Current capture surfaces

- [x] 1.1 Record `Link` (fields, `shortCode`, `userId`), `LinksToPosts`, and the admin link form: who owns a link, how it is addressed publicly, and where it is editable.
- [x] 1.2 Record `VideoBookmark` and state explicitly that it is a timestamp marker inside a video, not a saved link — and therefore that the word "bookmark" is unavailable for the quick save.
- [x] 1.3 Record `Post` + `PostImage` (raw `url` + `fileKey`, `postId`, `userId`) and how post images differ from `PhotoImage`.
- [x] 1.4 Record `Video` (provider fields, `VideoVisibility`, channels, tags) and what a video needs before it can be published.
- [x] 1.5 Record `HikeNote` and `Track.privateNote`, and state the boundary: a saved item's `note` is a caption, not the future `Note` entity — and that `HikeNote` is hike-scoped (coordinates, `dayKey`) rather than general, so a future general `Note` would probably absorb it.

## 2. Conventions and image pipeline

- [x] 2.1 Record the `/my/*` personal pages (`tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases`), their auth gate, and the reuse of `components/admin-pages` panels.
- [x] 2.2 Record the upload routes in `app/api/uploadthing/core.ts` (both routes, their middleware, and their limits) and the `FileAsset` lifecycle (`purpose`, `visibility`, `status`, timestamps).
- [x] 2.3 Record how `Photo` + `PhotoImage` + `HikesToPhotos` model a curated photo set with ordering, and why reusing it for a saved item's small image is or is not appropriate.

## 3. Carrier options

- [x] 3.1 Evaluate a per-type table (`VideoCandidate`) and state what adding a second type costs under it.
- [x] 3.2 Evaluate a generic table with a nullable `type` column plus a `typeMeta` payload, including what a saved link with no type stores and what the second type costs.
- [x] 3.3 Evaluate a generic table plus a subtype table (`SavedItem` + `SavedItemVideo`) and its extra table and join cost.
- [x] 3.4 Decide the default generic type value (`GENERIC`, not `LINK` — that name already belongs to an existing model), the type storage (a Prisma/Postgres enum with a migration per new type, or a validated string with no migration), who sets the type (an owner choice, a derivation from the URL host, or a default that is overridden), and state that the type is mutable and the URL is the source of truth.
- [x] 3.5 Fill the comparison matrix with a verdict per option on: cost to add the second type, identity semantics, query ergonomics, ownership/visibility, and the per-type detailed form.

## 4. Boundaries and promotion

- [x] 4.1 Decide the boundary with `Link`: separate model, a kind of `Link`, or a private draft that promotes into one — and state the difference between a quick save and the admin link form.
- [x] 4.2 Trace the promotion path into `Video`: which fields are copied, re-fetched, or missing, and who owns the result.
- [x] 4.3 Trace the promotion path into `Post` and into `Link`, naming the fields that cannot be derived from the saved item.
- [x] 4.4 State whether the saved item survives promotion as a linked history, is consumed, or stays in sync, and the direction of the link — and whether one saved item may promote into several targets, which decides between a link column and a join table.
- [x] 4.5 Split the carrier fields (title, URL, note, image, owner, timestamps) from the per-type extension fields, and name the mechanism the extension attaches through.

## 5. Media, identity, and metadata

- [x] 5.1 Recommend how the optional small image is attached — capture versus detailed form; single nullable `imageFileAssetId` versus a join row (the `PhotoImage` precedent) versus a JSON array of `FileAsset` ids; and the migration path — and state the concrete boundary against the `outdoor-photo-albums-structure` candidate: what is needed now, what is deferred. Price a pasted image URL as a rendered third-party URL that a server-side fetch would turn into an SSRF path.
- [x] 5.2 State the dedupe rules (by normalized URL, by provider identity, or globally), the persisted normalized key and its normalization rules, the behavior on a duplicate, and the resolution between unique `(userId, normalizedUrl)` and folder membership. State the per-host-class normalization rules, that the persisted key is polymorphic in shape (a provider id for YouTube, a normalized URL otherwise), how the two value classes are kept from colliding (a namespaced key or separate columns with partial unique indexes), and the rule for an owner editing the URL: the key is recomputed, and the recomputation can collide with an existing row.
- [x] 5.3 State the metadata-fetch boundary: provider allowlist, URL canonicalization per provider, SSRF constraints, and sync versus on-demand versus background.

## 6. Product surface

- [x] 6.1 Record where the quick save lands relative to the `/my/*` pages and the public surfaces, including the navigation entry point.
- [x] 6.2 Evaluate folders and tags: flat versus nested, a virtual Inbox, counts, and bulk actions.
- [x] 6.3 State the publication, rights, and moderation boundary: private by default, what a path to the public `/videos` feed would require, how `VideoVisibility` and the trust roles apply, and whether the carrier itself carries a `status`/`visibility` from v1.
- [x] 6.4 State the search and indexing rule for a growing personal list: which fields, whether v1 includes it, and which index.

## 7. Output

- [x] 7.1 Write `output.md` with every section required by `design.md`, each claim citing its evidence.
- [x] 7.2 Write the ordered slice plan with dependencies, naming the personal-capture-first order.
- [x] 7.3 Update `openspec/backlog.md` with the media-library deferral boundary found in 5.1.
- [x] 7.4 Run `npx openspec validate research-004-universal-saved-items --strict`.
- [x] 7.5 Confirm the `universal-note-entity` research candidate in `openspec/research-backlog.md` reflects the boundary found in 1.5; do not file a duplicate.
