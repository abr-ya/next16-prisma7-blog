# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-tracks/spec.md` for the required behavior.

`TrackMapLeaflet` already accepts `tracks: TrackMapViewModel[]`, draws one polyline per model with a rotating colour palette, adds a tooltip when there is more than one line, and `FitTrackMapBounds` frames all supplied tracks. The public track page currently passes only `track.map`, which `resolveTrackGeometry` resolves from the primary source. `feature-142` stores every secondary file's parsed metadata in `TrackGeometry.metadata`, and `toTrackMapViewModel` already turns metadata into the simplified line the map uses. No raw GPX fetch or re-parse is needed.

## Goals / Non-Goals

**Goals:**

- Show the route shape and the recorded trace together on the public track page.
- Keep the existing single-map behavior unchanged when a track has no secondary geometry.
- Reuse the multi-track map and stored metadata instead of adding a second map component.
- Make the route visually primary and the recording clearly secondary.

**Non-Goals:**

- Trip maps, admin maps, or any surface other than `/tracks/[slug]`.
- Layer toggles, per-line downloads, ordering controls, or a per-track visibility switch.
- Re-parsing or fetching a secondary GPX at render time.
- General N-geometry management; `feature-143` owns adding and removing secondary files.

## Decisions

### 1. Extend the public detail projection with a map per secondary file

Add `metadata: true` to the `geometries` select in `publicTrackDetailSelect`. Add a `map` field to the secondary-file projection:

```ts
export type PublicTrackSecondaryFile = PublicTrackFile & {
  map: TrackMapViewModel | null;
};
```

`toPublicTrack` builds it with the existing helper:

```ts
map: toTrackMapViewModel(row.fileAsset.name, row.metadata, {
  fileAssetId: row.fileAsset.id,
  fileKey: row.fileAsset.fileKey,
})
```

The helper already returns `null` for missing, stale, or failed metadata, and it validates the source file id/key, so a stale parse never draws as current. The full `metadata` stays server-side; only the simplified `map` crosses to the client. The list query does not select `geometries`, so `/tracks` is unchanged.

Alternative considered: select and ship the raw metadata to the client. Rejected because the map only needs the simplified line and the metadata may contain the timed timeline.

### 2. Carry the line role on `TrackMapViewModel`

Add an optional `style?: "primary" | "secondary"` to `TrackMapViewModel` (in `lib/track-gpx-metadata.ts`). The secondary projection sets `style: "secondary"`; the primary map and every existing map view model leave it undefined.

`TrackMapLeaflet` uses the role for three things:

- **Colour and stroke**: the primary keeps the existing teal (`#0f766e`) solid line; a secondary line uses blue (`#0369a1`), weight 2, dash `6 6`. Maps without a role keep the existing rotating palette, so the trip map is unchanged.
- **Draw order**: secondary lines render before the primary, so the route stays visible when the two overlap.
- **Endpoints**: the existing S/E markers stay for a single track. When a secondary line is present, the first track without `style: "secondary"` gets the S/E markers, so the route keeps its orientation; the recording line has none.

Alternative considered: a parallel `trackStyles` prop. Rejected because the role travels with the map model the page already builds, and the existing trip-map callers need no new prop.

### 3. Render the combined map on the public track page

Replace the single `TrackMap` call with `CombinedTrackMap`:

```tsx
const mapTracks = [track.map, ...track.secondaryFiles.flatMap((file) => (file.map ? [file.map] : []))]
  .filter((map): map is TrackMapViewModel => map !== null);
```

Set the secondary model's title to `"Original recording"` in the projection so the tooltip and legend read naturally; the primary title stays the track title. Render the fallback when `mapTracks` is empty. Pass `showLegend` so the map shows a compact legend with a colour dot and the title for each line. `showLegend` defaults to `false`, so trip maps are unchanged.

The page remains a server component; the legend and map are inside the existing client map component. No new translation namespace: the public page is English today and the legend uses the stored titles.

Alternative considered: keep `TrackMap` and add a second map below it. Rejected because two maps split the viewport and cannot frame both shapes together.

### 4. Visibility policy: the shape is public, the file is not

The recorded trace becomes visible to every viewer of a published track, while the GPX download link continues to follow the existing file-visibility and ownership rules from `feature-142`. The map renders only stored, already-public map geometry; it never exposes a provider URL or raw file URL. This is recorded in the modified visibility requirement.

Alternative considered: owner-only recording layer. Rejected by the owner's decision to show it to everyone; the simpler projection and a single public map are the result.

## Risks / Trade-offs

- [The recorded trace reveals where the owner actually went] → Accepted explicitly: the shape is public with the track, the file download stays private. A per-track visibility switch is a separate feature if it is ever needed.
- [Two lines overlap and hide each other] → The recording draws underneath as a thinner dashed blue line, and the route draws on top in teal.
- [A stale or failed secondary parse draws wrong geometry] → `toTrackMapViewModel` validates the stored source id/key and returns `null`; the line is simply skipped.
- [Legend grows with several secondary files] → `feature-143` can revisit the legend; this slice supports the one-secondary case that exists today and degrades to a list of titles.
- [The public detail payload grows] → Only the simplified map geometry is added, and only to the detail query; listings stay unchanged.
- [Primary endpoints disappear on a dual map] → The first non-secondary track keeps the S/E markers, so the route orientation survives.

## Migration Plan

No database migration. Deploy the projection and map changes together; existing tracks with no secondary rows render exactly as before.

Rollback: revert the page and projection; stored metadata is untouched.

## Open Questions

None that change scope.
