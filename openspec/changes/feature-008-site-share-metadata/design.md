## Context

The root layout currently defines only a static site title and description. Public detail pages for blog posts, docs, and videos render content-specific titles and images in the page body but do not provide dynamic share metadata. Next.js App Router supports route-level `generateMetadata()`, which can reuse existing data helpers and return Open Graph/Twitter metadata for crawlers.

## Goals / Non-Goals

**Goals:**

- Centralize metadata construction in one helper so titles, descriptions, canonical URLs, Open Graph, and Twitter cards are consistent.
- Add dynamic metadata to public detail pages where content data exists.
- Use content-specific preview images when available and a stable fallback image otherwise.
- Keep the first slice small and public-page focused.

**Non-Goals:**

- Add admin controls for custom share metadata.
- Add JSON-LD, sitemap generation, or robots changes.
- Add external image-generation services.
- Change Prisma schema or stored content models.
- Customize metadata for admin/auth routes.

## Decisions

### Shared Helper With Route Adapters

Create a helper such as `lib/site-metadata.ts` that accepts title, optional description, route path, and optional image URL, then returns a `Metadata` object with Open Graph and Twitter fields. Individual routes remain responsible for loading their own public content and passing the relevant values.

Alternative considered: write full metadata objects in every route. That would work, but it would duplicate title formatting, fallback image logic, URL construction, and Twitter/Open Graph shape.

### Dynamic Detail Pages, Static Listing Pages

Use `generateMetadata()` on public detail routes that already fetch content by slug/id. Listing pages can use static metadata because their preview should describe the collection rather than a single record.

### Content-Specific Image Priority

Preview image priority should be:

1. Blog post `imageUrl`.
2. Video `thumbnailUrl`.
3. A shared site fallback preview image.

Docs currently have `title` and optional `description` but no image field, so docs should use the fallback image unless a later feature adds doc images.

### Safe Description Derivation

When a page has no explicit description, derive a short plain-text description from existing content only if it can be done safely and cheaply. HTML-rich blog content should be stripped/truncated in a helper. If derivation is empty, use the site default description.

## Risks / Trade-offs

- Metadata crawlers require absolute URLs for reliable previews. Mitigation: define a site base URL helper from environment configuration with a safe local/default fallback.
- Existing external image URLs may not be accepted by every platform. Mitigation: pass only valid HTTP(S) image URLs and fall back to the local preview image when absent.
- Dynamic metadata can duplicate data fetching already done by the page. Mitigation: keep metadata queries focused and rely on Next/React request memoization where available.
- Missing content should not produce misleading metadata. Mitigation: missing private/public content routes should fall back to generic metadata or route not-found behavior.

## Migration Plan

No database migration is expected. Rollback can remove route-level `generateMetadata()` functions, the helper, and the fallback preview asset without affecting stored content.

## Open Questions

- None for planning. The first implementation should use existing content fields and fallback behavior.
