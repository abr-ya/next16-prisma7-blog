## 1. Blog Metadata

- [ ] 1.1 Add static share metadata to `/blog` with collection title, description, canonical URL, Open Graph, Twitter card, and fallback image behavior.
- [ ] 1.2 Add side-effect-free dynamic metadata generation to `/blog/[slug]`.
- [ ] 1.3 Derive blog post detail metadata from existing post title, content, slug, and image fields.
- [ ] 1.4 Return generic fallback metadata for missing or unavailable blog post slugs.

## 2. Remaining Public Pages

- [ ] 2.1 Add stable share metadata to `/` using the shared metadata builder.
- [ ] 2.2 Add stable share metadata to `/comments` using the shared metadata builder.
- [ ] 2.3 Confirm admin and authentication routes remain out of scope.

## 3. Metadata Helpers

- [ ] 3.1 Reuse existing metadata helper behavior for title formatting, descriptions, canonical URLs, Open Graph, Twitter cards, and fallback preview images.
- [ ] 3.2 Add or extend a small text-description helper only if post content cannot be described cleanly with the existing helper.

## 4. Validation

- [ ] 4.1 Run OpenSpec validation for `feature-012-site-share-metadata-content-pages`.
- [ ] 4.2 Run TypeScript validation with `npm run tsc`.
- [ ] 4.3 Run lint validation for changed app/component/lib files.
- [ ] 4.4 Run or hand off `npm run build` and manually inspect share metadata expectations for `/`, `/blog`, `/blog/[slug]`, and `/comments`.
