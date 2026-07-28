## 1. Planning

- [x] 1.1 Confirm docs-only scope in proposal, design, delta spec, and backlog.

## 2. Implementation

- [x] 2.1 Add reusable doc description normalization for metadata previews.
- [x] 2.2 Add collection share metadata to `/docs`.
- [x] 2.3 Add dynamic share metadata to `/docs/[slug]` with neutral fallback behavior for missing docs.

## 3. Validation

- [x] 3.1 Run OpenSpec validation for `feature-009-docs-share-metadata`.
- [x] 3.2 Run TypeScript validation with `npm run tsc`.
- [x] 3.3 Run lint validation for changed app/lib files.
- [x] 3.4 Document local `npm run build` and manual browser checks for final closeout.

## Closeout Notes

- Ran `openspec validate feature-009-docs-share-metadata --strict`.
- Ran `npm run tsc`.
- Ran `npx eslint app/docs/page.tsx app/docs/[slug]/page.tsx lib/site-metadata.ts --quiet`.
- Local closeout should include `npm run build` and a browser check for `/docs` plus an existing `/docs/[slug]` page.
