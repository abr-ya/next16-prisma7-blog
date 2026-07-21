## Why

Admins and visitors can already see channel badges on videos, but they cannot narrow video lists to a specific channel. This change makes channel browsing practical by adding channel filter state to the admin and public video lists while preserving existing sort and pagination behavior.

## What Changes

- Add channel filtering to the admin video list so admins can view owned videos for one channel or return to all channels.
- Add channel filtering to the public `/videos` list so visitors can browse public videos for one public channel.
- Preserve supported `sort`, `page`, and channel filter state in URL query parameters on the public video list.
- Keep existing public visibility rules: public browse remains scoped to `PUBLIC` videos and must not expose private videos through filters.
- Add channel-oriented sorting controls where the channel list/filter UI needs stable ordering.
- Non-goals:
  - Video tags, tag assignment, tag badges, and tag filtering remain in `feature-004-video-tags`.
  - Full-text video search remains in `feature-006-video-search`.
  - Provider filters remain out of this slice.
  - Public channel detail pages are not required for this slice.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-library`: add admin and public channel filter behavior for video lists.

## Impact

- Affected routes: `/admin/videos`, `/videos`.
- Affected data access: video list queries and channel lookup helpers.
- Affected UI surfaces: admin video table controls and public video browse controls.
- Affected data models: no schema changes expected; use existing `Video.channelId`, `VideoChannel`, and visibility fields.
