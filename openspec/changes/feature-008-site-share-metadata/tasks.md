## 1. Shared Metadata Foundation

- [ ] 1.1 Add a shared metadata helper under `lib` for title formatting, descriptions, canonical URLs, Open Graph, Twitter cards, and fallback images.
- [ ] 1.2 Add or define a stable site fallback preview image available from a public URL.
- [ ] 1.3 Update `app/layout.tsx` with site defaults and metadata base behavior.
- [ ] 1.4 Add small text helpers for safe plain-text description derivation and truncation.

## 2. Public Route Metadata

- [ ] 2.1 Add static collection metadata for `/blog`, `/docs`, and `/videos`.
- [ ] 2.2 Add dynamic metadata for `app/blog/[slug]/page.tsx` from post title, image, and derived description.
- [ ] 2.3 Add dynamic metadata for `app/docs/[slug]/page.tsx` from doc title and optional description.
- [ ] 2.4 Add dynamic metadata for `app/videos/[id]/page.tsx` from public video title and thumbnail.
- [ ] 2.5 Ensure missing or private content does not expose content-specific metadata.

## 3. Validation

- [ ] 3.1 Update OpenSpec/backlog status or related checklist notes as implementation progresses.
- [ ] 3.2 Run `openspec validate feature-008-site-share-metadata --strict`.
- [ ] 3.3 Run `npm run tsc`.
- [ ] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 3.5 Ask the user to run local `npm run build` and paste the result before completion.
- [ ] 3.6 Manually inspect rendered metadata for one blog post, one doc, one public video, and one listing page.
