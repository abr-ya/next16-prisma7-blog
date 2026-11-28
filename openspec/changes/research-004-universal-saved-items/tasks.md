# Tasks

## 1. Current capture surfaces

- [ ] 1.1 Record `Link` (fields, `shortCode`, `userId`), `LinksToPosts`, and the admin link form: who owns a link, how it is addressed publicly, and where it is editable.
- [ ] 1.2 Record `VideoBookmark` and state explicitly that it is a timestamp marker inside a video, not a saved link — and therefore that the word "bookmark" is unavailable for the quick save.
- [ ] 1.3 Record `Post` + `PostImage` (raw `url` + `fileKey`, `postId`, `userId`) and how post images differ from `PhotoImage`.
- [ ] 1.4 Record `Video` (provider fields, `VideoVisibility`, channels, tags) and what a video needs before it can be published.

## 2. Conventions and image pipeline

- [ ] 2.1 Record the `/my/*` personal pages (`tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases`), their auth gate, and the reuse of `components/admin-pages` panels.
- [ ] 2.2 Record the upload routes in `app/api/uploadthing/core.ts` (both routes, their middleware, and their limits) and the `FileAsset` lifecycle (`purpose`, `visibility`, `status`, timestamps).
- [ ] 2.3 Record how `Photo` + `PhotoImage` + `HikesToPhotos` model a curated photo set with ordering, and why reusing it for a saved item's small image is or is not appropriate.

## 3. Carrier options

- [ ] 3.1 Evaluate a per-type table (`VideoCandidate`) and state what adding a second type costs under it.
- [ ] 3.2 Evaluate a generic table with a nullable `type` column plus a `typeMeta` payload, including what a saved link with no type stores and what the second type costs.
- [ ] 3.3 Evaluate a generic table plus a subtype table (`SavedItem` + `SavedItemVideo`) and its extra table and join cost.
- [ ] 3.4 Fill the comparison matrix with a verdict per option on: cost to add the second type, identity semantics, query ergonomics, ownership/visibility, and the per-type detailed form.

## 4. Boundaries and promotion

- [ ] 4.1 Decide the boundary with `Link`: separate model, a kind of `Link`, or a private draft that promotes into one — and state the difference between a quick save and the admin link form.
- [ ] 4.2 Trace the promotion path into `Video`: which fields are copied, re-fetched, or missing, and who owns the result.
- [ ] 4.3 Trace the promotion path into `Post` and into `Link`, naming the fields that cannot be derived from the saved item.
- [ ] 4.4 Split the carrier fields (title, URL, note, image, owner, timestamps) from the per-type extension fields, and name the mechanism the extension attaches through.

## 5. Media, identity, and metadata

- [ ] 5.1 Recommend how the optional small image is attached, and state the concrete boundary against the `outdoor-photo-albums-structure` candidate: what is needed now, what is deferred.
- [ ] 5.2 State the dedupe rules (by normalized URL, by provider identity, or globally) and the behavior on a duplicate.
- [ ] 5.3 State the metadata-fetch boundary: provider allowlist, URL canonicalization per provider, SSRF constraints, and sync versus on-demand versus background.

## 6. Product surface

- [ ] 6.1 Record where the quick save lands relative to the `/my/*` pages and the public surfaces, including the navigation entry point.
- [ ] 6.2 Evaluate folders and tags: flat versus nested, a virtual Inbox, counts, and bulk actions.
- [ ] 6.3 State the publication, rights, and moderation boundary: private by default, what a path to the public `/videos` feed would require, and how `VideoVisibility` and the trust roles apply.

## 7. Output

- [ ] 7.1 Write `output.md` with every section required by `design.md`, each claim citing its evidence.
- [ ] 7.2 Write the ordered slice plan with dependencies, naming the personal-capture-first order.
- [ ] 7.3 Update `openspec/backlog.md` with the media-library deferral boundary found in 5.1.
- [ ] 7.4 Run `npx openspec validate research-004-universal-saved-items --strict`.
