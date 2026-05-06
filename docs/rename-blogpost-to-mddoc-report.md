# Rename BlogPost to MdDoc — completion report

## Summary

The markdown-backed content model was renamed from `BlogPost` to **`MdDoc`** everywhere in TypeScript (`@@map("BlogPost")` keeps the **Postgres table** `BlogPost` unchanged). Admin routes **`/md-posts` → `/md-docs`**, public routes **`/blog-md` → `/docs`**. **Permanent redirects** preserve old bookmarks in `next.config.ts`.

## Changes

### Database

- **No migrations.** Table name remains **`BlogPost`**. Prisma model is `MdDoc` with:

```prisma
@@map("BlogPost")
```

### Schema and client

- [prisma/schema.prisma](prisma/schema.prisma): `model BlogPost` replaced by `model MdDoc` + `@@map("BlogPost")`.
- Regenerated client: `npx prisma generate` (success).

### Data layer (new files | removed)

| Removed | Added |
|---------|--------|
| `app/_data/blogPosts.ts` | [app/_data/mdDocs.ts](app/_data/mdDocs.ts) |
| `app/_data/getBlogPosts.ts` | [app/_data/getMdDocs.ts](app/_data/getMdDocs.ts) |

Exports: `getMdDocById`, `createMdDoc`, `updateMdDoc`, `deleteMdDoc`; `getAllMdDocs`, `getLatestMdDocs`, `getMdDocBySlug`. All use `prisma.mdDoc.*`. Cache: `revalidatePath("/docs", "layout")` plus `revalidatePath("/")`.

### Admin UI

| Removed | Added |
|---------|--------|
| `components/admin-pages/blog-post-form.tsx` | [components/admin-pages/md-doc-form.tsx](components/admin-pages/md-doc-form.tsx) |
| `components/admin-pages/blog-posts-table.tsx` | [components/admin-pages/md-docs-table.tsx](components/admin-pages/md-docs-table.tsx) |

Barrel ([components/index.ts](components/index.ts)): `MdDocForm`, `MdDocFormValues`, `MdDocsTable`.

### Lib

| Removed | Added |
|---------|--------|
| `lib/prisma-blog-load-error-message.ts` | [lib/prisma-md-docs-load-error-message.ts](lib/prisma-md-docs-load-error-message.ts) |

Function: `getMdDocsLoadErrorMessage`.

### Public and admin routes

| Removed | Added |
|---------|--------|
| `app/blog-md/page.tsx` | [app/docs/page.tsx](app/docs/page.tsx) |
| `app/blog-md/[slug]/page.tsx` | [app/docs/[slug]/page.tsx](app/docs/[slug]/page.tsx) |
| `app/(admin)/md-posts/page.tsx` | [app/(admin)/md-docs/page.tsx](app/(admin)/md-docs/page.tsx) |
| `app/(admin)/md-posts/[id]/page.tsx` | [app/(admin)/md-docs/[id]/page.tsx](app/(admin)/md-docs/[id]/page.tsx) |

### Other components

- [components/docs/post-article.tsx](components/docs/post-article.tsx), [components/docs/posts-section.tsx](components/docs/posts-section.tsx), [components/docs/md-post-card.tsx](components/docs/md-post-card.tsx): type `MdDoc`; links use `/docs`.
- [components/home-page/recent-docs.tsx](components/home-page/recent-docs.tsx): `getLatestMdDocs`, `getMdDocsLoadErrorMessage`.
- [components/home-page/hero-section.tsx](components/home-page/hero-section.tsx): link `/docs`.
- [components/admin-pages/admin-sidebar.tsx](components/admin-pages/admin-sidebar.tsx): **MD Docs** → `/md-docs`.

### Seed

- [prisma/seed.ts](prisma/seed.ts): `mdDocs` array; `prisma.mdDoc.create`.

### Redirects

- [next.config.ts](next.config.ts): `redirects()` with `permanent: true` for `/blog-md` and `/md-posts` trees to `/docs` and `/md-docs`.

## Verification

- `npx prisma generate` — success.
- `npm run tsc` — success **after** removing stale `.next` (see below).

## Notes for developers

1. **Stale `.next` types:** `tsconfig.json` includes `.next/types/**/*.ts`. After moving routes, delete `.next` (or run a fresh `next dev` / `next build`) so generated route validators match the filesystem.
2. **Historical docs:** [docs/project-analysis.md](docs/project-analysis.md), [docs/home-db-error-handling-implementation.md](docs/home-db-error-handling-implementation.md), and [docs/home-db-error-handling-plan.md](docs/home-db-error-handling-plan.md) still mention `BlogPost`, `/blog-md`, or `getLatestBlogPosts`. Update when convenient.

## Follow-ups

- Optional: align copy on public `PageLayout` title ("Markdown Blog Page") with the new `/docs` naming.
- Optional: refresh older `docs/*.md` references listed above.
