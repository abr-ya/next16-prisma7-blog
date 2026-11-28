# Research Design

## Method

1. **Inventory the current capture surfaces.** Read the models and the surfaces that already hold "something the user saved or pointed at": `Link` + `LinksToPosts` + the admin link form, `VideoBookmark`, `Post` + `PostImage`, `Video`, `Photo` + `PhotoImage` + `HikesToPhotos`, `FileAsset`. Record for each: who owns it, how it is addressed, how it is displayed, and what it lacks.
2. **Read the personal-page convention.** Read `/my/*` (`tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases`) and the admin panels they reuse in `components/admin-pages`, so the proposed placement follows an existing pattern instead of inventing one.
3. **Read the image pipeline.** Read `app/api/uploadthing/core.ts` (both upload routes and their middleware), the `FileAsset` lifecycle (`purpose`, `visibility`, `status`, `uploadedAt`, `updatedAt`, `deletedAt`), and the two different ways an image is referenced today: `PhotoImage` → `FileAsset` and `PostImage` → raw `url` + `fileKey`. Record what a "small image on a saved item" can reuse as-is. Decide, from that evidence, whether the image belongs to the capture form or the detailed form, and whether a single `imageFileAssetId`, a join row (the `PhotoImage` precedent), or a JSON array of `FileAsset` ids is the right carrier shape. Price a pasted image URL as what it is: a third-party URL that the app renders (hotlink, tracking pixel) and that a server-side fetch would turn into an SSRF path.
4. **Compare carrier options.** Evaluate the per-type table, the generic table with `type` + `typeMeta`, and the generic table plus subtype table on: cost to add the second type, identity/dedupe semantics, query ergonomics, ownership and visibility, and how a per-type detailed form attaches. Test each option against the dedupe rule, the folder membership rule, and the URL-edit rule, not only against the type extension. Fill the comparison matrix with a verdict per option.
5. **Trace the promotion path.** For `Video`, `Post`, and `Link`, record what a promotion copies, re-points, or re-fetches, and which fields cannot be derived from the saved item. State whether the saved item survives promotion as a linked history, is consumed, or stays in sync, and whether one saved item may promote into several targets, which decides between a link column and a join table.
6. **Bound the metadata fetch.** Record URL canonicalization rules per provider, the allowlist that keeps an arbitrary URL fetch from becoming an SSRF hole, and the sync/async/on-demand options.
7. **State the media deferral.** Record what the saved item needs from media today, and what stays in the `outdoor-photo-albums-structure` candidate, so the two tracks do not overlap.
8. **State the notes boundary.** Read `HikeNote` and `Track.privateNote`, record that `HikeNote` is hike-scoped (coordinates and a `dayKey`) rather than general, and record why a saved item's `note` is a caption rather than the future `Note` entity.
9. **Produce the slice plan.** Order the slices so the personal capture works before any type-specific enrichment, and name each dependency.

## Evidence standard

- Every claim about current behavior cites a file and the function, model, or component that proves it.
- Every option in the comparison matrix gets a verdict; an option with no verdict counts as not investigated.
- The recommendation states its conditions for invalidation, not only its benefits.
- The media-library deferral names the backlog candidate it defers to and the concrete boundary, not just "later".
- Conclusions about the moderation boundary cite the existing `VideoVisibility` and trust-role surfaces.
- The notes boundary cites `HikeNote` and `Track.privateNote` by model, and the identity recommendation says whether the normalized URL is persisted and how folders interact with uniqueness.
- The type recommendation names the storage (a Prisma/Postgres enum or a validated string column) and who sets the type (an owner choice, a derivation from the URL host, or a default that is overridden), and the identity recommendation states the rule for an owner editing the URL against the persisted normalized key.
- The image recommendation prices a pasted image URL, and the promotion recommendation covers the one-to-many case.

## Rubric

- **Recommend** — fits the criteria, explains the migration path for the next type, and names the slices.
- **Skip** — fails compatibility or cost, with the failing criterion named.
- **Needs more research** — evidence is insufficient; name the missing measurement.

## Required Output Structure

`output.md` must contain, in this order:

1. Executive summary.
2. Current capture surfaces inventory.
3. Personal-page and admin-panel reuse convention.
4. Image pipeline and what a saved item can reuse.
5. Carrier options considered, including the type storage (enum versus validated string), who sets the type, and what an edit of the URL does to the normalized key.
6. Comparison matrix.
7. Boundary with `Link`, `VideoBookmark`, `Post`, and `Video`.
8. Promotion paths per target.
9. Minimal capture versus per-type detailed form, including whether the optional image belongs to capture at all.
10. Image attachment recommendation (single FK versus join row versus a JSON id array), the pasted-image-URL risk, and the media-library deferral boundary.
11. Identity, the persisted normalized key and its per-host-class rules, how the two value classes are kept apart (a namespaced key or separate columns with partial unique indexes), the URL-edit rule, the dedupe rules, and the dedupe-versus-folders resolution.
12. Metadata fetching, canonicalization, and the SSRF boundary.
13. Publication, rights, and moderation boundary, including whether the carrier carries a status/visibility from v1.
14. Page placement, navigation, and search/indexing for a growing list.
15. Folders, tags, and bulk behavior.
16. Promotion reversibility, the one-to-many case, and the link direction between a saved item and its target.
17. Boundary with notes and the future `Note` entity, including whether a general `Note` would absorb the hike-scoped `HikeNote`.
18. Recommendation: the v1 slice shape.
19. Ordered slice plan with dependencies.
20. Risks and open questions.
21. Evidence.
