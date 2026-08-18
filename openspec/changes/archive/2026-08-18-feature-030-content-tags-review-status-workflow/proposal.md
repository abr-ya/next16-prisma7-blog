## Why

Legacy and auto-created content tags can contain duplicates, casing variants, old names, or values that need human judgment. A hard legacy migration would make those values canonical too early, while hiding them would change public behavior for posts that already rely on tags.

This slice adds an admin-facing review status for shared content tags. Tags that need review continue to work everywhere users already see or use tags, but admins get a clear cleanup queue before later legacy migration imports old `Post.tags` values.

## What Changes

- Add a review status to shared `ContentTag` records, with existing tags treated as reviewed/active by default.
- Allow admins to manually mark an existing shared tag as needs-review or reviewed.
- Add an admin review surface for needs-review tags with usage visibility for linked posts.
- Let admins resolve needs-review tags by approving, removing from selected posts, replacing with another tag, or merging into an existing or newly created tag.
- Keep public tag display, public tag links, admin post tag assignment, and post reads working for both reviewed and needs-review tags.
- Update content-tag planning language so legacy post migration imports old values into this review workflow instead of making them canonical immediately.

### Non-goals

- No automatic import of legacy `Post.tags` values in this slice.
- No public filtering behavior changes.
- No video tag migration onto shared content tags.
- No site-wide tag metadata such as colors, descriptions, ordering, or SEO pages.
- No broad admin tag manager beyond review/resolve actions needed for needs-review tags.

## Capabilities

### Modified Capabilities

- `content-tags`: Add review-status semantics, admin cleanup requirements, and updated follow-up boundaries for legacy post migration and broader tag management.

## Impact

- **Schema**: additive review status field or enum on `ContentTag`; existing rows default to reviewed/active.
- **Data helpers**: content-tag queries/mutations for status updates, usage lookup, replace/remove/merge operations.
- **Admin UI**: likely `/admin` content-tags review page or section, plus status controls.
- **Public UI**: no visible behavior change; tags requiring review still render and route like regular shared tags.
- **Auth**: review and cleanup actions require existing admin authorization.
- **Follow-ups**: `content-tags-legacy-post-draft-migration` imports legacy strings as needs-review assignments after this workflow exists.
