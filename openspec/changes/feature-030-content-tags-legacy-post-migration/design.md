## Context

After feature-029, post create/update writes shared `ContentTag` records and `PostsToContentTags` assignments and dual-writes `Post.tags`. Display prefers assignments, then legacy `Post.tags`.

Any post never re-saved still exposes tags only through `Post.tags`. Those values may contain casing variants, duplicates, empties, or junk the operator does not want as canonical shared tags. Feature-019/029 deliberately deferred bulk transfer; this slice delivers a controlled migration with review, not a silent deploy hook.

## Goals / Non-Goals

**Goals:**

- Inventory remaining **legacy-only** posts: non-empty `Post.tags` and **zero** content-tag assignments.
- Present operators with raw legacy values, occurrence counts, suggested slug/name after `normalizeContentTags` rules, and post association counts.
- Support dry-run (no DB writes except optional audit) and apply with the same policy.
- Support optional **drop** (exclude value from migration) and optional **rename/merge** mapping to a target display name/slug.
- On apply, for each eligible post: upsert content tags for kept tags, create assignments, dual-write `Post.tags` to sorted kept display names.
- Idempotent re-run; skip posts that already have assignments.
- Role-gate with admin role checks used elsewhere for sensitive admin actions.
- Emit a structured summary for audit (posts processed, tags upserted, assignments created, values dropped, posts skipped).

**Non-Goals:**

- Ongoing rename/merge/delete of already-shared tags across content types (`feature-031`).
- Migrating videos off `VideoTag`.
- Dropping the `Post.tags` column.
- Automatic migration without admin action.
- Perfect UI for bulk row editing of every mapping edge case—JSON/map-friendly policy + inventory table is enough.

## Decisions

### Eligible Population Is “Legacy-Only Posts”

A post is eligible when:

1. it has at least one non-empty legacy tag after trim, and  
2. it has **no** `PostsToContentTags` rows.

Posts with any assignment are already on the shared path (even if `Post.tags` differs); dual-read prefers assignments. Unifying partial drift is **out of scope** (admin form re-save or feature-031 later).

**Alternative considered:** migrate every post including merge of assignment + leftover legacy strings. Riskier under dual-read (assignments win → leftovers disappear) and mixed sources; deferred.

### Normalization Matches Feature-029

Reuse `createContentTagSlug` / `normalizeContentTagName` / `normalizeContentTags` from `lib/content-tags.ts`. Empty/slugless inputs are dropped automatically. Multiple raw strings with the same slug collapse to one tag (first canonical name wins in map order after sort—document: prefer the first sorted name for slug collisions unless rename policy overrides).

### Policy Object: Drop + Rename, Not Full Graph Editor

Operator provides:

```ts
type LegacyPostTagMigrationPolicy = {
  /** Normalized slugs or raw strings that should not become assignments; stripped from dual-write names on migrated posts. */
  drop?: string[];
  /** Map normalized slug (of legacy value) → target { name, slug? }. If slug omitted, derive from name. */
  renameBySlug?: Record<string, { name: string; slug?: string }>;
};
```

Rules:

1. Normalize each raw `Post.tags` entry → `{ name, slug }`.
2. If slug or raw is in **drop** (match slug or exact raw after trim), exclude.
3. If slug is in **renameBySlug**, replace with target name/slug.
4. Dedupe by final slug; upsert `ContentTag`; assign all finals to the post.
5. Set `Post.tags` to sorted final display names.

**Alternative considered:** interactive per-row merge UI. Better as part of feature-031; overkill for a one-time cleanup on a personal site.

### Dry-Run Then Apply

- **Dry-run:** compute per-post planned final tags, planned ContentTag creates vs reuses, counts; write nothing to content tables (optional log “migration preview”).
- **Apply:** same computation, then transactional per-post or batched updates with upserts. Prefer: for each post, transaction upsert tags + `deleteMany` assignments (none exist) + create assignments + update `Post.tags`.

No deploy-time auto-apply.

### Admin Surface

Ship **`/admin/tags`** as the durable Tags admin page:

1. **Header / shell** — title Tags, admin-only access, sidebar link.
2. **Shared tags management section (placeholder)** — short copy that listing, rename, merge, detach, and usage visibility for existing shared tags will arrive in `feature-031`; no functional management UI in this slice.
3. **Legacy post-tag migration section (this feature)** — the only interactive block for now:
   - Summary counts (eligible posts, unique raw tags).
   - Table: raw value, count, suggested slug, sample post slugs (capped).
   - Optional policy input (`drop` + `renameBySlug`; empty policy = migrate all normalized values).
   - Buttons: Dry run, Apply (native confirm until feature-038).
   - Result panel: last run summary.

Server actions in `app/_data` / dedicated module; server-only. Layout should make migration clearly temporary one-time cleanup under the broader Tags home so feature-031 can replace the placeholder without inventing a second route.

**Auth:** use existing admin role helper (`isAdmin` / project equivalent), not merely authenticated. Match backup-style sensitive ops when available.

### Audit

On dry-run and apply, call existing `createLogEvent` (or equivalent) with a concise description: mode, posts processed, tags upserted, assignments created, drops, skips. Do not store full post bodies.

### Compatibility After Migration

- Migrated posts display via assignments; dual-write keeps `Post.tags` aligned.
- Unmigrated (skipped / never eligible) stay on dual-read fallback.
- Column `Post.tags` remains indefinitely until a later deprecation decision (not this feature).

## Risks / Trade-offs

- **Dual-read + partial legacy:** migrating only some strings on a multi-tag post while leaving others only in `Post.tags` would hide leftovers once assignments exist → Mitigation: every apply rewrites each post to the full planned set (kept + renamed − dropped) for that post in one step.
- **Wrong drop/rename policies:** hard to reverse cleanly → Mitigation: dry-run first; no automatic bootstrap migration; keep drop/rename explicit.
- **Name collision on slug:** second display name loses uniqueness of label under same slug → Mitigation: document rename map; inventory shows collisions.
- **Large catalogs:** many posts → Mitigation: batch apply; show progress counts; no need for background job in v1 if post counts stay small.

## Migration Plan

1. Ship inventory + dry-run + apply behind admin role.
2. Operator runs inventory/dry-run in staging or prod with empty policy.
3. Optionally adjust drop/rename and re-dry-run.
4. Apply once; re-run dry-run to confirm zero remaining legacy-only posts (or only intentionally skipped).
5. Rollback: restore from DB backup if catastrophic; code cannot un-merge ContentTags automatically. Partially applied posts stay with assignments (safe for dual-read).

## Open Questions

- None blocking. Sidebar placement: next to other content admin items (e.g. after posts/categories) during implementation.
- Exact placeholder copy and section order can follow existing admin page typography.
