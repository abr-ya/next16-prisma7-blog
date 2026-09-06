## Context

See `proposal.md` for motivation. Published `/hikes/[slug]` wraps content in `PageLayout`, whose inner shell is hardcoded `max-w-3xl`. The hike article also sets `max-w-3xl`, which cannot exceed the parent. The public `/hikes` listing already tries `max-w-5xl` on an inner wrapper, but that wider class is currently dead for the same reason. Map and gallery components already fill 100% of their parent; they will get wider once the parent is wider. No schema, auth, or visibility changes are in scope.

## Goals / Non-Goals

**Goals:**

- Let hike detail opt into a `max-w-5xl` content shell through `PageLayout`.
- Keep title/badges/description on a `max-w-3xl` measure inside that shell.
- Let map, linked tracks, and gallery span the wide shell.
- Share one named pair of width classes so `PageLayout` and hike detail do not drift.

**Non-Goals:**

- Do not change listing, track, docs, or other `PageLayout` callers in this slice.
- Do not restyle the map, markers, or gallery grid.
- Do not introduce a full design-token system.

## Decisions

### Add an opt-in `contentWidth` to `PageLayout`

Keep the default `PageLayout` shell at `max-w-3xl`. Add a `contentWidth` prop (`"narrow"` default, `"wide"` → `max-w-5xl`) and use `"wide"` only on `/hikes/[slug]`. Existing callers stay visually unchanged.

Alternative considered: drop `PageLayout` on hike detail and compose a local shell. That would duplicate title/spacing and make later outdoor pages invent their own widths.

Alternative considered: change `PageLayout` globally to `max-w-5xl`. That would widen docs, comments, and other prose pages that should stay on the current measure.

### Split prose measure from media width on hike detail

Inside the wide shell, keep type/date badges and description in a `max-w-3xl` (or equivalent named narrow) column. Leave the title in `PageLayout` at the wide shell width — headings wrap cleanly and should stay aligned with the media below. Map, linked-track cards, and the photo gallery span the full wide shell. Remove the redundant inner article `max-w-3xl` (and the extra inner `px-4` if it only duplicates `PageLayout` padding).

Alternative considered: widen the entire hike page, including description, to `max-w-5xl`. That is simpler, but long trip notes would get ~100+ character lines and fights the backlog's readability constraint.

Alternative considered: full-bleed map to the viewport edge. That is a larger visual change than this slice needs and would fight the shared page padding.

### Extract two named content-width classes, not a token platform

Add a small shared helper next to layout (for example `lib/site-content-width.ts` or exports from `components/layout/page-layout.tsx`) with:

- narrow → `max-w-3xl`
- wide → `max-w-5xl`

`PageLayout` and the hike detail prose column import those classes. Do not add CSS variables, Tailwind theme tokens, or a site-wide spacing scale in this slice.

Alternative considered: keep raw Tailwind classes at each call site. Easy now, but the listing already drifted (`max-w-5xl` child inside a `max-w-3xl` parent) for that reason.

### Leave `/hikes` listing width for a follow-up

The listing's inner `max-w-5xl` is currently clamped by `PageLayout`. Fixing it is one prop, but this candidate is hike detail map/gallery squeeze, not listing cards. Call it out in tasks as out of scope so it is not silently "fixed" mid-slice.

## Risks / Trade-offs

- [Risk] Title at `max-w-5xl` while description is `max-w-3xl` can look left-weighted. → Mitigation: keep left alignment; do not center the prose column. Revisit only if the desktop check looks broken.
- [Risk] Leaflet can leave a blank map after container resize. → Mitigation: reuse the existing map height/CSS; check desktop and a narrow viewport after the width change.
- [Risk] Other `PageLayout` pages accidentally pick up wide width. → Mitigation: default remains narrow; only hike detail passes `"wide"`.
- [Risk] Nested padding (`PageLayout` `px-4` plus article `px-4`) still shrinks usable map width. → Mitigation: drop redundant inner horizontal padding on the hike article while keeping the shared `PageLayout` gutter.

## Migration Plan

1. No database migration.
2. Add the shared width helper and `PageLayout` `contentWidth` prop with narrow default.
3. Switch `/hikes/[slug]` to the wide shell and split prose vs media columns.
4. Validate with `tsc`, lint, local build, and browser checks for a hike with map+gallery and a hike with neither, on desktop and a mobile viewport.

Rollback: revert the layout prop and hike detail classes. Content, maps, and photos are unchanged.

## Open Questions

None. Listing-page width remains a documented follow-up, not a blocker.
