## Context

`MdDoc` currently stores `slug`, `title`, optional `description`, and markdown `content`. The docs metadata slice (`feature-009-docs-share-metadata`) makes `/docs/[slug]` metadata reusable, but docs still have no content-specific preview image field. The admin MD docs form already edits core doc fields, and the project has an existing UploadThing-backed image uploader component that can be reused or tightened for this surface.

This feature should be implemented after `feature-009-docs-share-metadata` is closed, because it depends on doc detail metadata already flowing through `buildPageMetadata`.

## Goals / Non-Goals

**Goals:**

- Add a nullable preview image URL to `MdDoc`.
- Let admins upload, replace, and clear a doc preview image while editing MD docs.
- Use the preview image as the share metadata image for `/docs/[slug]` when present.
- Preserve fallback metadata images when no doc image exists.

**Non-Goals:**

- Do not make images required.
- Do not add crop/edit tooling or a media library.
- Do not change public markdown rendering beyond metadata image selection.
- Do not apply the same image field to blog posts in this slice.

## Decisions

- Add a nullable string field, tentatively `previewImageUrl`, to `MdDoc`. This keeps the migration additive and mirrors other URL-based media fields in the project. The alternative is a separate media table, but that is too much structure for one optional image.
- Store the uploaded image URL directly on the doc. The existing UploadThing flow already returns a usable URL, and metadata generation only needs an absolute or framework-resolvable image URL.
- Extend `MdDocFormValues` and the admin form with an optional image field. The form should support clearing the value so docs can return to fallback metadata.
- Pass `previewImageUrl` into `buildPageMetadata({ image })` on doc detail pages. The metadata helper already handles absolute URL conversion and fallback image behavior.

## Risks / Trade-offs

- Prisma migration requires database access -> mitigate by creating an additive migration and handing off the exact command if the sandbox cannot reach the configured database.
- Existing `ImageUploader` clear behavior may need tightening -> keep the change local to the uploader/form behavior and avoid broad upload refactors.
- Old docs have no preview image -> nullable field and fallback metadata preserve existing behavior.

## Migration Plan

1. Add nullable `previewImageUrl` to `MdDoc`.
2. Create an additive Prisma migration.
3. Regenerate the Prisma client through the existing project flow.
4. Update admin form/data helpers and doc detail metadata.
5. Validate with Prisma generation, TypeScript, lint, OpenSpec validation, local build, and a browser check of admin edit plus public metadata behavior.

## Open Questions

- None.
