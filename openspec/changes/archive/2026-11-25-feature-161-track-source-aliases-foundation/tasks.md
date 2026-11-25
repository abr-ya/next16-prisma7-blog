# Tasks

## 1. Schema and migration

- [x] 1.1 Add `TrackSourceAliasKind`, `TrackSourceAlias`, and the `User.sourceAliases` back-relation to `prisma/schema.prisma` with the unique key and index from the design.
- [x] 1.2 Run `npx prisma validate` and `npx prisma generate`.
- [x] 1.3 Create the additive migration SQL against the previous schema (`prisma/migrations/20261125120000_feature_161_track_source_aliases`).
- [x] 1.4 Apply the migration through the pooler if the direct Neon endpoint is unavailable (`prisma db execute` plus `migrate resolve --applied`), then confirm an empty `migrate diff`.
- [x] 1.5 Do not edit generated Prisma files or existing migrations.

## 2. Read and page

- [x] 2.1 Add `app/_data/track-source-aliases.ts` with the owner-scoped `getOwnerSourceAliases` read (id, kind, rawValue, label, createdAt; ordered by kind then raw value).
- [x] 2.2 Add `app/(public)/my/source-aliases/page.tsx` with `requireAuth`, `dynamic = "force-dynamic"`, metadata, and `PageLayout contentWidth="wide"`.
- [x] 2.3 Render the explanation, two kind groups, and the empty state; add no mutation controls.
- [x] 2.4 Add the **Source names** user-menu entry with a `Fingerprint` icon and the navigation/workspace locale keys in English and Russian.

## 3. Verification

- [x] 3.1 Run `npm run tsc`.
- [x] 3.2 Run `npm run lint` and targeted `npx eslint` for the page, the data helper, and the menu.
- [x] 3.3 Run `npx openspec validate --changes --strict`.
- [x] 3.4 Run a production build in the sandbox, or ask the owner to run it locally.
- [x] 3.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; this slice creates no aliases.
