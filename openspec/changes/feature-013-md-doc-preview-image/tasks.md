## 1. Data Model

- [ ] 1.1 Add nullable `previewImageUrl` field to `MdDoc` in Prisma schema.
- [ ] 1.2 Create an additive Prisma migration for the markdown doc preview image field.
- [ ] 1.3 Regenerate Prisma client with the existing project flow.

## 2. Admin Workflow

- [ ] 2.1 Extend MD doc form values, validation, create helper, and update helper to include optional `previewImageUrl`.
- [ ] 2.2 Add preview image upload/replace control to the MD doc admin form.
- [ ] 2.3 Support clearing an existing preview image from the MD doc admin form.
- [ ] 2.4 Load and pass existing preview image values into the admin edit page.

## 3. Public Metadata

- [ ] 3.1 Use `previewImageUrl` as the `/docs/[slug]` metadata image when present.
- [ ] 3.2 Preserve stable fallback preview image behavior when a doc has no preview image or is missing.

## 4. Validation

- [ ] 4.1 Run Prisma validation/generation and note any sandbox database limitations.
- [ ] 4.2 Run OpenSpec validation for `feature-013-md-doc-preview-image`.
- [ ] 4.3 Run TypeScript validation with `npm run tsc`.
- [ ] 4.4 Run lint validation for changed app/component/lib files.
- [ ] 4.5 Run or hand off `npm run build` and browser checks for admin upload plus public doc metadata.
