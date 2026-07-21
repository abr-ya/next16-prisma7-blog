## Why

Admins should be able to save a video link and have useful provider metadata filled in automatically when the URL is supported. The saved link remains the primary record, so metadata extraction must enrich the record without making video creation or editing brittle.

## What Changes

- Add provider-aware metadata fields to saved videos, starting with YouTube-compatible URLs.
- Extract and persist provider name, provider video ID, canonical embed URL, and thumbnail URL when available.
- Run metadata extraction during admin create/edit flows when the URL is saved.
- Preserve manual thumbnail behavior: custom thumbnail values are not silently overwritten.
- Keep create/edit failure-tolerant when metadata is unavailable, unsupported, invalid, or temporarily fails.
- Surface saved metadata on admin and public video views where it improves scanning or playback.

## Non-goals

- Do not require provider metadata before saving a video.
- Do not add broad multi-provider API integrations beyond the initial provider abstraction and YouTube support.
- Do not fetch provider metadata that requires external API credentials, such as YouTube duration.
- Do not change video visibility rules or public access to private videos.
- Do not add video search, tags, notes, comments, import/export, or bulk actions in this slice.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-library`: Video records gain optional provider metadata extraction and persistence while preserving failure-tolerant admin saves and existing visibility behavior.

## Impact

- Affected routes: `/admin/videos`, `/admin/videos/{id}`, `/videos`, and `/videos/{id}`.
- Affected data model: `Video` gains optional provider metadata fields.
- Affected admin surface: video create/edit form, admin video table/detail data, and existing thumbnail fetch behavior.
- Affected public surface: public video list/detail may show or use saved metadata for thumbnails and embeds.
- Affected helpers: `app/_data/videos.ts`, `lib/video-providers/*`, thumbnail normalization, and Prisma migration/client generation.
