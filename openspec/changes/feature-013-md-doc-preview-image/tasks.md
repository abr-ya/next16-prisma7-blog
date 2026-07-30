## 1. Data Model

- [x] 1.1 Add nullable `previewImageUrl` field to `MdDoc` in Prisma schema.
- [x] 1.2 Create an additive Prisma migration for the markdown doc preview image field.
- [x] 1.3 Regenerate Prisma client with the existing project flow.

## 2. Admin Workflow

- [x] 2.1 Extend MD doc form values, validation, create helper, and update helper to include optional `previewImageUrl`.
- [x] 2.2 Add preview image upload/replace control to the MD doc admin form.
- [x] 2.3 Support clearing an existing preview image from the MD doc admin form.
- [x] 2.4 Load and pass existing preview image values into the admin edit page.

## 3. Public Metadata

- [x] 3.1 Use `previewImageUrl` as the `/docs/[slug]` metadata image when present.
- [x] 3.2 Preserve stable fallback preview image behavior when a doc has no preview image or is missing.

## 4. Validation

- [x] 4.1 Run Prisma validation/generation and note any sandbox database limitations.
- [x] 4.2 Run OpenSpec validation for `feature-013-md-doc-preview-image`.
- [x] 4.3 Run TypeScript validation with `npm run tsc`.
- [x] 4.4 Run lint validation for changed app/component/lib files.
- [x] 4.5 Run or hand off `npm run build` and browser checks for admin upload plus public doc metadata.
