# Proposal

## Why

Administrators can manually edit a post slug, but cannot deliberately restore a title-derived value after changing the title or the slug. An explicit regeneration action makes that recovery predictable while retaining deliberate URL choices.

## What Changes

- Add an explicit **Regenerate slug** control to the slug field on the admin post create and edit form.
- Generate a replacement value from the current title only when the administrator activates that control.
- Preserve direct slug editing, the existing empty-slug auto-fill on title blur, and the current save-time uniqueness outcome.
- Keep the regenerated value unsaved until the administrator submits the form.

## Capabilities

### New Capabilities

- `admin-post-slug-regeneration`: Administrator-controlled regeneration of a blog post form slug from its current title.

### Modified Capabilities

- None.

## Impact

- Affected route surfaces: `/admin/posts/new` and `/admin/posts/[id]` through the shared `PostForm`.
- Affected code: `components/admin-pages/post-form.tsx` and the existing shared slug generator.
- No data-model, migration, API, public-route, dependency, or authorization change is required. Existing post save validation and the `Post.slug` unique constraint remain authoritative.

## Non-goals

- Automatically changing a slug when a title changes.
- Saving or publishing a regenerated slug without the administrator submitting the form.
- Generating collision-free alternatives, redirecting old blog URLs, or changing manual slug-entry behavior.
