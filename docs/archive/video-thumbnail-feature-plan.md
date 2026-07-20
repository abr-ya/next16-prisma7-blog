# Video Thumbnail Feature Plan

## Context

The video library currently stores a title, URL, video date, visibility, and ownership data. Public and admin video pages do not have a thumbnail. The project already uses UploadThing for image uploads, but the existing uploader accepts browser-selected files rather than copying a remote image from YouTube.

This document compares the available thumbnail strategies and defines the recommended first implementation.

## Goal

Add an optional thumbnail to a video so that:

- an admin can load a thumbnail from a supported YouTube URL;
- an admin can replace it with a manually uploaded image;
- admin and public video pages can render the saved thumbnail;
- video create/update remains usable when YouTube metadata is unavailable;
- the first version does not introduce unnecessary storage or cleanup work.

## Options Considered

### Option A: Store the YouTube thumbnail URL

Flow:

1. Parse the YouTube video ID from the entered URL.
2. Resolve a thumbnail URL.
3. Save that URL in `Video.thumbnailUrl`.
4. Render the remote image directly from YouTube's image host.

Advantages:

- no duplicate file storage;
- no server-side file copy is required;
- no UploadThing file needs to be deleted when the YouTube thumbnail changes;
- implementation is small and fits the existing `Video` model and form;
- the saved video can still be edited if thumbnail resolution fails.

Trade-offs:

- rendering depends on the external image host;
- a YouTube thumbnail can change or become unavailable;
- `next.config.ts` must allow the selected YouTube image host;
- thumbnail quality variants are not guaranteed to exist for every video.

### Option B: Copy the YouTube thumbnail to UploadThing

Flow:

1. Resolve the YouTube thumbnail URL.
2. Download or remotely upload the image on the server.
3. Store the resulting UploadThing URL and file key.
4. Delete the old file when a thumbnail is replaced or the video is deleted.

Advantages:

- the application controls the stored copy;
- rendering does not depend on YouTube after the copy succeeds;
- image delivery uses the same storage as other application images.

Trade-offs:

- duplicates a file already hosted by YouTube;
- consumes storage and upload bandwidth;
- requires server-side remote upload code;
- requires file lifecycle handling for replacement and deletion;
- creates orphaned files if a database update fails after upload;
- provider/API policy and refresh requirements need additional review before treating copied metadata as permanent.

### Option C: Resolve the thumbnail dynamically and do not store it

Flow:

1. Store only the video URL or provider video ID.
2. Derive the thumbnail URL every time a video is rendered.

Advantages:

- no thumbnail field or synchronization is required;
- YouTube URL changes are reflected immediately.

Trade-offs:

- manual thumbnail override becomes awkward;
- provider parsing runs throughout the UI;
- future non-YouTube providers require rendering-time adapters;
- the database does not preserve the admin's selected thumbnail.

## Recommendation

Use **Option A with a manual UploadThing override** for the first version.

Store one optional `thumbnailUrl` on `Video`. A YouTube thumbnail and a manually uploaded image are both represented as URLs, so the rendering layer stays provider-independent. Do not copy YouTube thumbnails into UploadThing automatically.

Use an explicit `Fetch thumbnail` button in the form rather than making thumbnail resolution part of the save transaction. This keeps the behavior visible to the admin and ensures that a temporary YouTube/API failure cannot block video creation or editing.

The first version should support YouTube only. Generic video URLs remain valid, but they require a manual image upload.

## YouTube Resolution Strategy

There are two viable YouTube-specific implementations.

### YouTube Data API

The official API returns thumbnail variants in `snippet.thumbnails`. This is the more formal metadata contract and can later provide duration and other provider metadata, but it requires an API key, quota handling, server-side configuration, and failure handling.

Reference: <https://developers.google.com/youtube/v3/docs/videos>

### Derived YouTube image URL

The application can parse the video ID and construct a YouTube image CDN URL. This avoids an API key and quota usage, but the URL pattern is a pragmatic provider convention rather than the same formal contract as the Data API. Higher-resolution variants may not exist for every video.

For the thumbnail-only MVP, start with the derived URL approach and a conservative thumbnail variant. Keep the resolver behind a small provider helper so it can be replaced by the YouTube Data API later without changing the form or database contract.

Supported URL shapes should include at least:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

The parser must validate the hostname and video ID instead of accepting arbitrary query-string values.

## Data Model

Add one optional field for the MVP:

```prisma
model Video {
  // Existing fields...
  thumbnailUrl String?
}
```

Do not add `thumbnailFileKey` in the first version. The current image uploader already stores URLs without completing a general file-deletion lifecycle. File-key tracking and orphan cleanup should be implemented as a separate storage-hardening task if the application begins deleting uploaded files.

Do not add duration, provider enums, channels, or tags as part of this feature. A provider helper may return a parsed provider video ID internally, but storing `provider` and `providerVideoId` can wait until metadata extraction or embeds need them.

## Form Behavior

Add a thumbnail section to `VideoForm`:

- URL field remains generic and required.
- `Fetch thumbnail` is enabled when the URL is valid.
- Clicking it attempts to parse a supported YouTube URL.
- On success, set `thumbnailUrl` in React Hook Form and show a preview.
- On unsupported or invalid URLs, show a clear toast without changing the current thumbnail.
- Provide the existing `ImageUploader` as a manual replacement path.
- Allow the thumbnail to be cleared.
- Saving does not perform a mandatory network metadata request.

For create mode, fetching a thumbnail should not require the video to exist in the database. For edit mode, changing the URL should not silently replace a previously selected custom thumbnail.

## Rendering

Use the saved `thumbnailUrl` on:

- the admin videos table;
- the public videos list;
- the public video detail page if the layout benefits from it.

Add the required YouTube image hostname to `next.config.ts` before using `next/image`. Keep a fallback layout for videos without thumbnails.

All thumbnails need meaningful `alt` text based on the video title. Public rendering must not infer or fetch metadata on every request.

## Server Actions

Extend `VideoActionValues`, `createVideo`, and `updateVideo` with `thumbnailUrl?: string | null`.

Validation rules:

- accept `null` or an HTTPS URL;
- trim string input;
- do not restrict saved manual thumbnails to YouTube hosts;
- keep create/update owner-scoped as they are now.

If thumbnail extraction is implemented as a server action, it must authenticate the admin, validate the input URL, and return a typed success/error result. With derived URLs, a pure shared helper is preferable because no secret is required.

## Failure Handling

- Invalid YouTube URL: show an error and preserve the existing thumbnail.
- Supported URL without an available high-resolution image: use the conservative default variant or allow manual upload.
- External image fails at render time: preserve page layout and show the no-thumbnail fallback.
- UploadThing upload fails: show the existing upload error and keep the previous value.
- Thumbnail is absent: video save and public visibility behavior remain unchanged.

## Policy and Operational Notes

The YouTube Data API developer policies include rules for stored API data and periodic refresh/deletion. If the implementation later switches to the Data API or stores more YouTube metadata, review the current policy requirements and add a refresh strategy.

Reference: <https://developers.google.com/youtube/terms/developer-policies>

UploadThing supports server-side remote uploads, so copying an external image remains possible later if product requirements change.

Reference: <https://docs.uploadthing.com/api-reference/ut-api#uploadfilesfromurl>

## Acceptance Criteria

- `Video` can store an optional thumbnail URL.
- Admin can fetch a thumbnail from supported YouTube URL formats.
- Admin can replace or clear a thumbnail URL.
- Thumbnail fetch failure never blocks saving the video.
- Existing videos without thumbnails continue to work.
- The public detail page renders a saved thumbnail with a fallback.
- Private video access rules remain unchanged.
- TypeScript, app lint, and targeted component lint pass.

The current implementation is accepted as the thumbnail MVP. Manual upload, list/table thumbnail rendering, and broader fallback polish are optional follow-ups.

## Out of Scope

- copying YouTube thumbnails to UploadThing automatically;
- YouTube duration extraction;
- non-YouTube provider adapters;
- background metadata refresh jobs;
- automatic deletion of old UploadThing files;
- video embeds;
- changing generic video URL validation to YouTube-only validation.

## Could Do Later

- Add manual thumbnail upload using the existing UploadThing flow.
- Add thumbnail rendering to `VideosTable`.
- Add thumbnail rendering to the public videos list.
- Add stable list/table fallbacks for missing thumbnails and image load errors.
- Add title-based thumbnail `alt` text to list and table thumbnail views.

## Implementation Checklist

The archived executable checklist is maintained in `docs/archive/video-thumbnail-feature-task-list.md`.
