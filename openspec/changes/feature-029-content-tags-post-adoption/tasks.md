## 1. Schema and helpers

- [ ] 1.1 Add `ContentTag` and `PostsToContentTags` models (and `Post` / relation fields) to `prisma/schema.prisma` without removing `Post.tags`.
- [ ] 1.2 Create and apply an additive Prisma migration; regenerate the Prisma client.
- [ ] 1.3 Add `lib/content-tags.ts` with input types, slug/name normalization, and sorted dedupe matching the video-tag rules.
- [ ] 1.4 Add `resolvePostDisplayTags` (or equivalent) that prefers content-tag assignment names and falls back to legacy `Post.tags`.
- [ ] 1.5 Add `getAllContentTags` (or equivalent data helper) for admin tag option loading.

## 2. Post write path

- [ ] 2.1 In `createPost`, normalize tags, upsert `ContentTag` rows, create post assignments, and dual-write sorted display names into `Post.tags`.
- [ ] 2.2 In `updatePost`, replace the post's content-tag assignments to match the form set and dual-write `Post.tags` the same way.
- [ ] 2.3 Keep post mutation auth, status, and image sync behavior unchanged outside tags.

## 3. Post read path and admin UI

- [ ] 3.1 Include content-tag assignments on `getPostById`, `getPostBySlug`, `getAllPosts`, and other post queries used for tag display or admin edit.
- [ ] 3.2 Seed admin post edit tags from `resolvePostDisplayTags` / shared assignments with legacy fallback.
- [ ] 3.3 Optionally wire post form tag options from `getAllContentTags` without changing non-tag form fields.
- [ ] 3.4 Ensure public blog detail and listing cards render display tags from the dual-read helper (omit badges when empty).

## 4. Validation and bookkeeping

- [ ] 4.1 Run `npm run tsc` and fix type errors from new models/helpers.
- [ ] 4.2 Run `npm run lint` and targeted ESLint on changed non-`app/` files.
- [ ] 4.3 Ask for a local `npm run build` when schema/routes need full verification; do not bulk-migrate historical posts.
- [ ] 4.4 Manually verify: create/edit post with tags, reload admin seed, public detail/list badges, post with only legacy tags still shows them, video tags unchanged.
- [ ] 4.5 Set `feature-029` backlog status to `In Progress` during implementation and `Done` after archive.
