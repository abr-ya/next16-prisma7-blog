## Why

Public hike detail (`/hikes/[slug]`) currently renders inside `PageLayout`'s `max-w-3xl` (~768px) column, so the combined route map and photo gallery feel squeezed. After maps and inferred photo markers shipped, the page needs a wider content shell without turning the title and description into unreadably long lines.

## What Changes

- Give published `/hikes` and `/hikes/[slug]` a wide content container (`max-w-7xl`, comfortable on a 1920px desktop) so listing cards, the route map, linked-track cards, and photo gallery can use more horizontal space.
- Keep title, type/date badges, and description on a narrower readable measure inside that wide shell.
- Teach `PageLayout` an explicit content-width choice so hike listing and hike detail can opt into the wide column. The current inner `max-w-3xl` is the real bottleneck; nested child `max-w-*` classes cannot exceed it.
- Extract a small shared content-width token/helper for the narrow (`max-w-3xl`) and wide (`max-w-7xl`) shells so hike detail and `PageLayout` do not hard-code diverging values.
- Show public hike listing cards, linked-track cards, and hike photo gallery tiles in up to three columns on the wide shell (one column on narrow viewports).

Non-goals:

- No change to `/tracks/[slug]`, docs, blog, videos, comments, or admin pages in this slice.
- No map marker clustering, coincident-photo tooltip, day filter, or notes layer.
- No hike-to-trip rename, public uploads, or schema/migration work.
- No site-wide design-token system or Tailwind theme overhaul beyond the two named content widths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hikes`: Public hike listing and hike detail use a wide content container; listing cards use up to three columns on medium-and-up viewports, while hike detail keeps title and description on a readable measure.
- `outdoor-hike-media-map`: The hike route map, linked-track cards, and hike photo gallery occupy the wide hike-detail content column; photo tiles and track cards use up to three columns on medium-and-up viewports.

## Impact

- Affected route: public `/hikes` and `/hikes/[slug]`.
- Affected layout: `components/layout/page-layout.tsx` gains an opt-in wide content width; default remains `max-w-3xl` for existing callers.
- Affected UI: hike listing grid, hike detail article structure (prose column vs full-width map/gallery/track list), and a three-column media grid; no change to map data, photo visibility, or Leaflet behavior.
- Affected data models: none.
- Follow-ups: coincident photo markers (`outdoor-hike-map-coincident-photo-markers`) remain separate.
- Validation: OpenSpec strict validation, `tsc`, lint, local build, and a manual desktop/mobile check of `/hikes` and `/hikes/[slug]`.
