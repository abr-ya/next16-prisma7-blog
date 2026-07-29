## Why

Public video detail pages currently choose either an embedded player or a thumbnail preview. Visitors should be able to see the preview first, then choose the player when embedding is available, while unsupported videos should explain why player mode cannot be used.

## What Changes

- Always show the saved video preview/thumbnail area on public video detail pages.
- Add a preview/player toggle for public video detail media.
- Enable player mode only when the video has an embeddable URL.
- Disable player mode with a short reason when embed playback is unavailable.
- Keep the external open-video action as the fallback way to watch the original video.

## Non-goals

- Do not change video provider extraction or add new embed providers.
- Do not change the `Video` data model or add migrations.
- Do not add autoplay, watch progress, analytics, or player preferences.
- Do not change public video list cards in this slice.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-library`: Update public video detail media behavior so previews are always visible and player mode is opt-in when available.

## Impact

- Affected route: `/videos/[id]`.
- Affected public surface: video detail media area.
- Affected components: existing video thumbnail/preview rendering plus a new or extracted detail media component under `components/video-pages`.
- Affected data model: none.
- Dependencies: none.
