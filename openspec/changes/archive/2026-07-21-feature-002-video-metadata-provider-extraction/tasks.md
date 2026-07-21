## 1. Data Model

- [x] 1.1 Add nullable provider metadata fields to the `Video` Prisma model.
- [x] 1.2 Create the Prisma migration and regenerate the Prisma client through the existing project flow.

## 2. Provider Extraction

- [x] 2.1 Add a normalized provider metadata type and extraction helper under `lib/video-providers`.
- [x] 2.2 Extend YouTube provider parsing to derive provider name, provider video ID, thumbnail URL, and embed URL from supported URL shapes.
- [x] 2.3 Keep extraction failure-tolerant by returning empty metadata for unsupported, invalid, or unparseable URLs.

## 3. Server Save Integration

- [x] 3.1 Update video create/edit server actions to run provider metadata extraction during saves.
- [x] 3.2 Persist extracted provider metadata when available and clear stale provider metadata when the saved URL is unsupported.
- [x] 3.3 Preserve manual thumbnail precedence while allowing provider thumbnail auto-fill when no thumbnail is submitted.

## 4. Admin and Public UI

- [x] 4.1 Show saved provider metadata in admin video surfaces where it improves scanning or editing context.
- [x] 4.2 Use saved provider metadata on public video views when present while preserving existing fallbacks.
- [x] 4.3 Keep existing row actions and manual thumbnail fetch behavior working with the new metadata fields.

## 5. OpenSpec and Validation

- [x] 5.1 Update `openspec/backlog.md` status for `feature-002-video-metadata-provider-extraction` as implementation progresses.
- [x] 5.2 Run `openspec validate feature-002-video-metadata-provider-extraction --strict`.
- [x] 5.3 Run `npm run tsc`.
- [x] 5.4 Run `npm run lint` and targeted lint for changed non-`app` files if needed.
- [x] 5.5 Run `npm run build` when feasible because this slice touches Prisma schema and user-facing video routes.
- [x] 5.6 Perform a manual browser check expectation for supported YouTube URLs, unsupported URLs, custom thumbnails, and public/private video visibility.
