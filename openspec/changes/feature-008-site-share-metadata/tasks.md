## 1. Shared Metadata Foundation

- [x] 1.1 Add a shared metadata helper under `lib` for title formatting, descriptions, canonical URLs, Open Graph, Twitter cards, and fallback images.
- [x] 1.2 Add or define a stable site fallback preview image available from a public URL.
- [x] 1.3 Update `app/layout.tsx` with site defaults and metadata base behavior.
- [x] 1.4 Keep helper inputs generic enough for later blog/docs/listing page adoption.

## 2. Public Video Metadata

- [x] 2.1 Add static collection metadata for `/videos`.
- [x] 2.2 Add dynamic metadata for `app/videos/[id]/page.tsx` from public video title and thumbnail.
- [x] 2.3 Ensure missing or private videos do not expose content-specific metadata.
- [x] 2.4 Leave blog, docs, and broader listing metadata explicitly deferred to `feature-009-site-share-metadata-content-pages`.

## 3. Validation

- [x] 3.1 Update OpenSpec/backlog status or related checklist notes as implementation progresses.
- [x] 3.2 Run `openspec validate feature-008-site-share-metadata --strict`.
- [x] 3.3 Run `npm run tsc`.
- [x] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [x] 3.5 Ask the user to run local `npm run build` and paste the result before completion.
- [x] 3.6 Manually inspect rendered metadata for `/videos` and one public video detail page.
