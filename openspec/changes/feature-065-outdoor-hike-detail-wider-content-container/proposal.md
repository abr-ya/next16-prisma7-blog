## Why

Public hike detail (`/hikes/[slug]`) currently renders inside `PageLayout`'s `max-w-3xl` (~768px) column, so the combined route map and photo gallery feel squeezed. After maps and inferred photo markers shipped, the page needs a wider content shell without turning the title and description into unreadably long lines.

## What Changes

- Give published `/hikes/[slug]` a wide content container (`max-w-5xl`, matching the intended listing width) so the route map, linked-track cards, and photo gallery can use more horizontal space.
- Keep title, type/date badges, and description on a narrower readable measure inside that wide shell.
- Teach `PageLayout` an explicit content-width choice so the hike detail page can opt into the wide column. The current inner `max-w-3xl` is the real bottleneck; nested child `max-w-*` classes cannot exceed it.
- Extract a small shared content-width token/helper for the narrow (`max-w-3xl`) and wide (`max-w-5xl`) shells so hike detail and `PageLayout` do not hard-code diverging values.

Non-goals:

- No change to `/hikes` listing layout, `/tracks/[slug]`, docs, blog, videos, comments, or admin pages in this slice.
- No map marker clustering, coincident-photo tooltip, day filter, notes layer, or gallery grid redesign.
- No hike-to-trip rename, public uploads, or schema/migration work.
- No site-wide design-token system or Tailwind theme overhaul beyond the two named content widths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hikes`: Public hike detail uses a wide content container for map-adjacent media while keeping title and description on a readable measure.
- `outdoor-hike-media-map`: The hike route map and hike photo gallery occupy the wide hike-detail content column rather than the narrower prose measure.

## Impact

- Affected route: public `/hikes/[slug]` only.
- Affected layout: `components/layout/page-layout.tsx` gains an opt-in wide content width; default remains `max-w-3xl` for existing callers.
- Affected UI: hike detail article structure (prose column vs full-width map/gallery/track list); no change to map data, photo visibility, or Leaflet behavior.
- Affected data models: none.
- Follow-ups: coincident photo markers (`outdoor-hike-map-coincident-photo-markers`) and listing-page width cleanup remain separate. `/hikes` already declares `max-w-5xl` on an inner wrapper, but `PageLayout` still clamps it to `max-w-3xl`.
- Validation: OpenSpec strict validation, `tsc`, lint, local build, and a manual desktop/mobile check of `/hikes/[slug]` with map + gallery and with neither.
