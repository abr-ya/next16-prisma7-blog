## Context

Today posts store tags only as `Post.tags String[]`. Admin create/update maps form `{ label, value }[]` into that array. Public listing (`PostCard`) and detail (`/blog/{slug}`) render `post.tags` directly. Videos already use reusable `VideoTag` + `VideosToVideoTags` with normalize/slug rules in `lib/video-tags.ts`.

Feature-019 accepted shared content tags (`ContentTag`, typed assignment tables, dual-read of legacy post strings). This slice is the first runtime adoption for **posts only**: introduce shared storage and switch post tag reads/writes onto it without bulk-migrating historical `Post.tags`.

## Goals / Non-Goals

**Goals:**

- Add `ContentTag` and `PostsToContentTags` with referential integrity matching the video join pattern.
- Normalize post tag inputs with the same slug/name rules that videos use.
- On post create/update, upsert shared tags and set that post's assignment set as authoritative for edits going forward.
- On post reads used for admin edit and public badges, prefer shared assignment display names; fall back to legacy `Post.tags` when a post has no assignments yet.
- Dual-write normalized names into `Post.tags` on save so untouched legacy-only readers and unmigrated comparison remain safe until `feature-030`.
- Leave `VideoTag` paths and data alone.

**Non-Goals:**

- Bulk import of existing `Post.tags` into `ContentTag` (`feature-030`).
- Admin tag manager / rename / merge / delete of shared tags (`feature-031`).
- Public tag filter pages or changing the semantics of `/blog/tag/{tag}` beyond using the display string currently shown.
- Extracting video helpers into a forced shared package beyond optional reuse of matching algorithms.
- Migrating videos onto `ContentTag`.

## Decisions

### Models Mirror The Video Pattern

Add:

```prisma
model ContentTag {
  id        String              @id @default(uuid())
  name      String
  slug      String              @unique
  posts     PostsToContentTags[]
  createdAt DateTime            @default(now())
  updatedAt DateTime            @default(now()) @updatedAt

  @@index([name])
}

model PostsToContentTags {
  post       Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId     String
  tag        ContentTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId      String
  assignedAt DateTime   @default(now())

  @@id([postId, tagId])
  @@index([tagId])
}
```

Keep `Post.tags String[]`. Cascade delete assignments when a post is deleted. Deleting a `ContentTag` cascades its assignment rows only; this slice does not add UI to delete tags.

**Alternative considered:** polymorphic `contentType`/`contentId` join. Rejected to keep FK integrity and Prisma relations simple (aligned with feature-019).

### Shared Normalization Helpers For Posts

Add `lib/content-tags.ts` with `ContentTagInput`, `createContentTagSlug`, `normalizeContentTags` matching video whitespace/slug/dedupe/sort rules. Prefer a small independent module over expanding video helpers API so video imports stay stable; optionally thin-reexport later.

**Alternative considered:** reuse `normalizeVideoTags` by import alias. Acceptable technically, but naming would couple “video” into posts.

### Write Path: Upsert + Replace Assignments + Dual-Write Strings

In `createPost` / `updatePost`:

1. Normalize form tags (drop empty/slugless).
2. For each normalized `{ name, slug }`, `upsert` `ContentTag` by `slug` (update `name` if slug exists).
3. Replace `PostsToContentTags` for that post to match the selected set (delete missing, create missing).
4. Dual-write `Post.tags` to the sorted display names from the normalized set (mirror of values used for assignments).

Replace is whole-set from the form, same as video form saves.

**Auth:** keep existing session checks on post mutations. Tags inherit post ownership/auth; assigning a tag does not change who can edit the post.

### Read Path: Prefer Assignments, Else Legacy Array

Introduce a pure helper, e.g. `resolvePostDisplayTags(post): string[]`, used by list/detail UI and admin form seed:

- If the post has one or more content-tag assignments → return those tags' `name`s (sorted like normalization).
- Else → return `Post.tags` as today.

Query layers (`getPostById`, `getPostBySlug`, `getAllPosts`, user post lists as needed) include:

```
contentTags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } }
```

(name the relation on `Post` e.g. `contentTags` or `tagAssignments`).

Admin edit page maps display tags to `{ label, value }` for the form. Load global content-tag options via `getAllContentTags()` for cretable/select UX parity with videos when low-risk; form can keep free-create if options are empty.

### Public Display Surfaces

- Blog detail already renders badges when `hasTags`; continue but feed display tags from `resolvePostDisplayTags`.
- Listing cards keep badges/`Link` to `/blog/tag/{tag}` using the **display name** string (unchanged contract; no new tag routing).

Tag display still only runs for posts already returned by existing public queries (no broader access via tags).

### Server/Client Boundary

All Prisma and assignment writes stay in server actions/`app/_data`. Client form still submits `{ label, value }[]` like today. No new client network package beyond existing react-select usage.

## Risks / Trade-offs

- **Dual sources until migration** → Dual-read prefers assignments; dual-write on edit keeps `Post.tags` aligned for edited posts. Unedited posts stay legacy-only until `feature-030`.
- **Name updates on slug collision** → Upsert updates `name` for an existing slug. Matching video behavior; admin management of rename policy is later.
- **Orphan ContentTag rows** → Allowed when no posts use them; no prune UI in this slice.
- **Listings without include** → Risk of missing assignments if a caller forgets include. Mitigation: helper that treats missing relation as empty and falls back to `Post.tags`; document include in tasks.
- **Schema migration** → Additive tables only; no destructive change to `Post.tags`.

## Migration Plan

1. Apply additive Prisma migration for `ContentTag` and `PostsToContentTags`.
2. Ship post write path + dual-write.
3. Ship dual-read on public/admin surfaces.
4. Do **not** auto-copy existing `Post.tags` into assignments.
5. Rollback: remove code paths and optionally drop new tables; legacy `Post.tags` remains primary in rollback of readers.

## Open Questions

- None blocking: content tags are global site-wide like `VideoTag`. Display metadata (color, description) stays out of this slice.
