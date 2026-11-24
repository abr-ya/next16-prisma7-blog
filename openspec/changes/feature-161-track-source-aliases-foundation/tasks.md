# Tasks

## 1. Schema and migration

- [ ] 1.1 Add `TrackSourceAliasKind`, `TrackSourceAlias`, and the `User.sourceAliases` back-relation to `prisma/schema.prisma` with the unique key and index from the design.
- [ ] 1.2 Run `npx prisma validate` and `npx prisma generate`.
- [ ] 1.3 Create the additive migration with the project flow. If the direct Neon endpoint is unavailable, generate the SQL against the previous schema and apply it through the pooler (`prisma db execute` plus `migrate resolve --applied`), then confirm an empty `migrate diff`.
- [ ] 1.4 Do not edit generated Prisma files or existing migrations.

## 2. Read and page

- [ ] 2.1 Add `app/_data/track-source-aliases.ts` with the owner-scoped `getOwnerSourceAliases` read (id, kind, rawValue, label, createdAt; ordered by kind then raw value).
- [ ] 2.2 Add `app/(public)/my/source-aliases/page.tsx` with `requireAuth`, `dynamic = "force-dynamic"`, metadata, and `PageLayout contentWidth="wide"`.
- [ ] 2.3 Render the explanation, two kind groups, and the empty state; add no mutation controls.
- [ ] 2.4 Add the **Source names** user-menu entry with a `Fingerprint` icon and the navigation/workspace locale keys in English and Russian.

## 3. Verification

- [ ] 3.1 Run `npm run tsc`.
- [ ] 3.2 Run `npm run lint` and targeted `npx eslint` for the page, the data helper, and the menu.
- [ ] 3.3 Run `npx openspec validate --changes --strict`.
- [ ] 3.4 Run a production build in the sandbox, or ask the owner to run it locally.
- [ ] 3.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; this slice creates no aliases.
