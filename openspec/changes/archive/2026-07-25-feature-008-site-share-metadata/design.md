## Context

The root layout currently defines only a static site title and description. Public video detail pages render content-specific titles and thumbnails in the page body but do not provide dynamic share metadata. Next.js App Router supports route-level `generateMetadata()`, which can reuse existing data helpers and return Open Graph/Twitter metadata for crawlers.

## Goals / Non-Goals

**Goals:**

- Centralize metadata construction in one helper so titles, descriptions, canonical URLs, Open Graph, and Twitter cards are consistent.
- Add dynamic metadata to public video detail pages.
- Use video thumbnails when available and a stable fallback image otherwise.
- Add static collection metadata for `/videos`.
- Keep the first slice small while leaving a reusable helper ready for later blog/docs/listing adoption.

**Non-Goals:**

- Add admin controls for custom share metadata.
- Add blog post, docs, or non-video listing metadata in this slice.
- Add JSON-LD, sitemap generation, or robots changes.
- Add external image-generation services.
- Change Prisma schema or stored content models.
- Customize metadata for admin/auth routes.

## Decisions

### Shared Helper With Route Adapters

Create a helper such as `lib/site-metadata.ts` that accepts title, optional description, route path, and optional image URL, then returns a `Metadata` object with Open Graph and Twitter fields. The video route remains responsible for loading public video data and passing the relevant values.

Alternative considered: write full metadata objects in every route. That would work, but it would duplicate title formatting, fallback image logic, URL construction, and Twitter/Open Graph shape.

### Video First, Other Content Later

Use `generateMetadata()` first on the public video detail route because videos already have title and optional thumbnail data. Add static metadata to `/videos` because its preview describes the collection rather than a single record. Blog posts, docs, and broader listing pages move to `feature-009-site-share-metadata-content-pages`.

### Content-Specific Image Priority

Preview image priority in this slice should be:

1. Video `thumbnailUrl`.
2. A shared site fallback preview image.

Later slices can add blog post `imageUrl` and docs fallback behavior without changing the helper contract.

### Safe Description Derivation

Videos currently do not have a dedicated description field. The video detail route should use a concise fallback description that includes the video context without inventing content-specific prose.

## Risks / Trade-offs

- Metadata crawlers require absolute URLs for reliable previews. Mitigation: define a site base URL helper from environment configuration with a safe local/default fallback.
- Existing external image URLs may not be accepted by every platform. Mitigation: pass only valid HTTP(S) image URLs and fall back to the local preview image when absent.
- Dynamic metadata can duplicate video fetching already done by the page. Mitigation: keep metadata queries focused and rely on Next/React request memoization where available.
- Missing content should not produce misleading metadata. Mitigation: missing private/public content routes should fall back to generic metadata or route not-found behavior.

## Migration Plan

No database migration is expected. Rollback can remove route-level `generateMetadata()` functions, the helper, and the fallback preview asset without affecting stored content.

## Open Questions

- None for planning. The first implementation should prove the shared helper on public video pages only.
