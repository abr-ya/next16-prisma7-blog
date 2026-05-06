# Rename BlogPost to MdDoc — execution plan

## Goal

- Use the domain name `MdDoc` consistently (Prisma model, server actions, form/table components, types, file names).
- Keep existing database rows: the Postgres table stays `BlogPost`; Prisma maps the model via `@@map("BlogPost")`.
- Rename routes:
  - Public `/blog-md` → `/docs` (including `/docs/[slug]`).
  - Admin `/md-posts` → `/md-docs` (including `/md-docs/new` and `/md-docs/[id]`).
- Add **permanent** redirects from old URLs to new ones in `next.config.ts`.

## Strategy

1. Update `prisma/schema.prisma`: `model MdDoc { ... @@map("BlogPost") }`.
2. Run `npx prisma generate` (no migration, no DB DDL).
3. Rename data modules, admin components, and update all imports and links.
4. Move route directories: `app/(admin)/md-posts` → `app/(admin)/md-docs`, `app/blog-md` → `app/docs`.
5. Update `revalidatePath` in server actions to target `/docs`.
6. Add `redirects()` in `next.config.ts`.
7. Run `npm run tsc` and fix any remaining references.

## Schema change

```prisma
model MdDoc {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("BlogPost")
}
```

## Data layer

| Old | New |
|-----|-----|
| `app/_data/blogPosts.ts` | `app/_data/mdDocs.ts` |
| `getBlogPostById` | `getMdDocById` |
| `createBlogPost` | `createMdDoc` |
| `updateBlogPost` | `updateMdDoc` |
| `deleteBlogPost` | `deleteMdDoc` |
| `prisma.blogPost.*` | `prisma.mdDoc.*` |
| `app/_data/getBlogPosts.ts` | `app/_data/getMdDocs.ts` |
| `getAllBlogPosts` | `getAllMdDocs` |
| `getLatestBlogPosts` | `getLatestMdDocs` |
| `getBlogPostBySlug` | `getMdDocBySlug` |

## Components and lib

| Old | New |
|-----|-----|
| `components/admin-pages/blog-post-form.tsx` | `components/admin-pages/md-doc-form.tsx` |
| `BlogPostForm` / `BlogPostFormValues` | `MdDocForm` / `MdDocFormValues` |
| `components/admin-pages/blog-posts-table.tsx` | `components/admin-pages/md-docs-table.tsx` |
| `BlogPostsTable` / `IBlogPostsTableProps` | `MdDocsTable` / `IMdDocsTableProps` |
| Prisma type `BlogPost` | `MdDoc` |
| `lib/prisma-blog-load-error-message.ts` | `lib/prisma-md-docs-load-error-message.ts` |
| `getBlogPostsLoadErrorMessage` | `getMdDocsLoadErrorMessage` |

## Routes (file moves)

- `app/(admin)/md-posts/page.tsx` → `app/(admin)/md-docs/page.tsx`
- `app/(admin)/md-posts/[id]/page.tsx` → `app/(admin)/md-docs/[id]/page.tsx`
- `app/blog-md/page.tsx` → `app/docs/page.tsx`
- `app/blog-md/[slug]/page.tsx` → `app/docs/[slug]/page.tsx`

## Link and cache updates

- All `/md-posts` → `/md-docs`; all `/blog-md` → `/docs`.
- `revalidatePath("/blog-md", "layout")` → `revalidatePath("/docs", "layout")`.

## Redirects (`next.config.ts`)

```ts
async redirects() {
  return [
    { source: "/blog-md", destination: "/docs", permanent: true },
    { source: "/blog-md/:slug*", destination: "/docs/:slug*", permanent: true },
    { source: "/md-posts", destination: "/md-docs", permanent: true },
    { source: "/md-posts/:rest*", destination: "/md-docs/:rest*", permanent: true },
  ];
}
```

## Verification

- `npx prisma generate` succeeds.
- `npm run tsc` passes.
- No remaining code references to `BlogPost`, `/blog-md`, or `/md-posts` except this plan, the follow-up report, historical docs, and SQL migrations.

## Post-execution

- Write `docs/rename-blogpost-to-mddoc-report.md` with summary, file list, and verification output.
