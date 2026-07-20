## 1. Table Pagination

- [x] 1.1 Extend the shared `DataTable` component with opt-in client-side pagination using TanStack Table pagination state.
- [x] 1.2 Add compact pagination controls that show current page state and previous/next navigation.
- [x] 1.3 Keep existing sorting behavior compatible with paginated rows.

## 2. Admin Videos Integration

- [x] 2.1 Enable pagination in `VideosTable` with a sensible default page size for the wide admin video table.
- [x] 2.2 Confirm existing row actions still work for visible paginated rows: open, copy video ID, fetch thumbnail, edit, and delete.
- [x] 2.3 Keep the current owner-scoped server query unchanged.

## 3. Validation

- [x] 3.1 Run targeted ESLint for changed component files.
- [x] 3.2 Run `npm run tsc`.
- [x] 3.3 Run `npm run lint`.
- [x] 3.4 Run `npm run build` when feasible.
- [x] 3.5 Perform a manual browser check expectation for `/admin/videos` with enough rows to require pagination.
