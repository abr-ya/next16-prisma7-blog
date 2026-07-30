## Why

Markdown docs should be able to carry a small optional preview image, so shared doc links can show a more specific image than the generic site fallback. This should remain optional and should build on the docs metadata slice instead of forcing every doc to upload artwork.

## What Changes

- Add an optional preview image URL to markdown docs.
- Let admins upload, replace, or clear the preview image from the MD docs form.
- Use a doc preview image as the Open Graph/Twitter metadata image for `/docs/[slug]` when present.
- Keep the existing stable site fallback preview image when a doc has no preview image.

## Non-goals

- Do not require a preview image for creating or updating markdown docs.
- Do not add image generation, cropping, or gallery management.
- Do not change markdown rendering content or docs list card layout unless needed to show the selected admin preview.
- Do not apply this image behavior to blog posts or videos in this slice.

## Capabilities

### New Capabilities

- `md-doc-preview-image`: Admin-managed optional preview images for markdown docs.

### Modified Capabilities

- `site-share-metadata`: Use markdown doc preview images for doc detail share metadata when present.

## Impact

- Affected data model: `MdDoc` gains a nullable preview image URL field.
- Affected admin surface: `/admin/md-docs/[id]` and `components/admin-pages/md-doc-form.tsx`.
- Affected public route: `/docs/[slug]` metadata image selection.
- Affected helpers: docs data helpers and existing metadata builder usage.
- Migration: additive Prisma migration only.
- Dependencies: none; reuse the existing UploadThing/image uploader direction where practical.
