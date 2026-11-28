# Research Design

## Method

1. **Inventory the current capture surfaces.** Read the models and the surfaces that already hold "something the user saved or pointed at": `Link` + `LinksToPosts` + the admin link form, `VideoBookmark`, `Post` + `PostImage`, `Video`, `Photo` + `PhotoImage` + `HikesToPhotos`, `FileAsset`. Record for each: who owns it, how it is addressed, how it is displayed, and what it lacks.
2. **Read the personal-page convention.** Read `/my/*` (`tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases`) and the admin panels they reuse in `components/admin-pages`, so the proposed placement follows an existing pattern instead of inventing one.
3. **Read the image pipeline.** Read `app/api/uploadthing/core.ts` (both upload routes and their middleware), the `FileAsset` lifecycle (`purpose`, `visibility`, `status`, `uploadedAt`, `updatedAt`, `deletedAt`), and the two different ways an image is referenced today: `PhotoImage` → `FileAsset` and `PostImage` → raw `url` + `fileKey`. Record what a "small image on a saved item" can reuse as-is.
4. **Compare carrier options.** Evaluate the per-type table, the generic table with `type` + `typeMeta`, and the generic table plus subtype table on: cost to add the second type, identity/dedupe semantics, query ergonomics, ownership and visibility, and how a per-type detailed form attaches. Fill the comparison matrix with a verdict per option.
5. **Trace the promotion path.** For `Video`, `Post`, and `Link`, record what a promotion copies, re-points, or re-fetches, and which fields cannot be derived from the saved item.
6. **Bound the metadata fetch.** Record URL canonicalization rules per provider, the allowlist that keeps an arbitrary URL fetch from becoming an SSRF hole, and the sync/async/on-demand options.
7. **State the media deferral.** Record what the saved item needs from media today, and what stays in the `outdoor-photo-albums-structure` candidate, so the two tracks do not overlap.
8. **Produce the slice plan.** Order the slices so the personal capture works before any type-specific enrichment, and name each dependency.

## Evidence standard

- Every claim about current behavior cites a file and the function, model, or component that proves it.
- Every option in the comparison matrix gets a verdict; an option with no verdict counts as not investigated.
- The recommendation states its conditions for invalidation, not only its benefits.
- The media-library deferral names the backlog candidate it defers to and the concrete boundary, not just "later".
- Conclusions about the moderation boundary cite the existing `VideoVisibility` and trust-role surfaces.

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
5. Carrier options considered.
6. Comparison matrix.
7. Boundary with `Link`, `VideoBookmark`, `Post`, and `Video`.
8. Promotion paths per target.
9. Minimal carrier versus per-type detailed form.
10. Image attachment recommendation and the media-library deferral boundary.
11. Identity and dedupe rules.
12. Metadata fetching, canonicalization, and the SSRF boundary.
13. Publication, rights, and moderation boundary.
14. Page placement and navigation.
15. Folders, tags, and bulk behavior.
16. Recommendation: the v1 slice shape.
17. Ordered slice plan with dependencies.
18. Risks and open questions.
19. Evidence.
