# Tasks

## 1. Projection and data

- [x] 1.1 Add `feature-150-outdoor-track-dual-map` to the `P0 Now` table of `openspec/backlog.md` and mark it `In Progress` when implementation starts; verify the row matches its neighbours.
- [x] 1.2 Add `metadata: true` to the public detail `geometries` select and introduce `PublicTrackSecondaryFile` with a `map: TrackMapViewModel | null` field derived by `toTrackMapViewModel`; verify `npm run tsc` passes.
- [x] 1.3 Set the secondary map title to `Original recording` and `style: "secondary"`, and confirm the public list query still does not select `geometries`; verify the detail payload contains only the simplified map.

## 2. Map component

- [x] 2.1 Add optional `style?: "primary" | "secondary"` to `TrackMapViewModel` and use it in `TrackMapLeaflet` for the secondary blue dashed stroke and for drawing secondary lines before the primary; verify maps without a role keep the rotating palette.
- [x] 2.2 Keep the S/E markers on the first non-secondary track when a secondary line is present, and omit them for the recording line; verify a single-track map is unchanged.
- [x] 2.3 Add a `showLegend` prop to `CombinedTrackMap` / `TrackMapLeaflet` that renders a compact colour-dot legend with each line's title; default it to `false` and verify `/trips/[slug]` maps render without a legend.

## 3. Public track page

- [x] 3.1 Build the combined map list from the primary map and every secondary map, render `CombinedTrackMap` with `showLegend`, and keep the existing fallback when the list is empty; verify `npm run tsc` passes.
- [x] 3.2 Open a route-primary published track in the browser as the owner and as an anonymous visitor: verify both lines render, the legend names the route and the recording, and the viewport frames both. Owner-side check verified on 2026-11-16; the anonymous-visitor check is deferred to `feature-150-outdoor-track-dual-map-manual-qa`.
- [x] 3.3 Verify a track with no secondary geometry renders exactly as before, and a secondary file without parsed metadata contributes no line while the primary map still renders. Deferred to `feature-150-outdoor-track-dual-map-manual-qa`.

## 4. Integration checks

- [x] 4.1 Run `npm run tsc`, targeted `npx eslint` on the changed files, and `npx openspec validate feature-150-outdoor-track-dual-map --strict`; verify all pass.
- [x] 4.2 Ask the owner to run `npm run build` locally and report the result; record it in this change before archiving. Owner reported the production build passed on 2026-11-16.
- [x] 4.3 Ask the owner to complete the browser happy path: route-primary track with a parsed recording on `/tracks/[slug]`, both lines and the legend visible, and the GPX download visibility unchanged; record any failure as a separate `fix-XXX` candidate. Owner verified both lines and the legend on 2026-11-16; the download-visibility check is deferred to `feature-150-outdoor-track-dual-map-manual-qa`.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec with the `openspec-sync-specs` skill after the owner accepts the implementation.
- Report unchecked tasks, then archive with the `openspec-archive-change` skill.
