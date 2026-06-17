# Video Feature Backlog

Use this backlog for video ideas that are not part of the current public pages milestone.

## Priority Candidates

### Metadata Extraction

Detailed thumbnail analysis and implementation tracking:

- `docs/video-thumbnail-feature-plan.md`
- `docs/video-thumbnail-feature-task-list.md`

- Add optional `thumbnailUrl` to `Video`.
- Add optional `durationSeconds` to `Video`.
- Add optional provider fields, such as `provider` and `providerVideoId`, if provider adapters need normalized lookup.
- Extract thumbnail and duration only when possible.
- Keep metadata extraction failure-tolerant: saving a valid URL must still work when metadata cannot be fetched.
- Start with provider adapters for the most useful sources, then leave generic URLs as metadata-optional.

### Channels

- Detailed plan: `docs/video-channel-feature-plan.md`.
- Replace the earlier folder idea with global external video channels.
- Add `VideoChannel` with `name`, external `url`, optional `imageUrl`, `visibility`, timestamps, and a relation to videos.
- Add optional `channelId` on `Video`.
- Use `onDelete: SetNull` so deleting a channel does not delete saved videos.
- Add channel CRUD in admin.
- Add channel selector to `VideoForm`.
- Show channels as external links in admin and public video views.
- Add channel filtering and sorting to admin and public video lists.

### Tags

- Model video tags closer to categories, not as a plain `String[]`.
- Add a user-owned `VideoTag` model.
- Add a join model such as `TagsToVideos`.
- Support multiple tags per video.
- Add tag selection in `VideoForm`.
- Add tag badges and tag filtering to list/detail views.

## Later Backlog

- Add video embeds after provider detection exists.
- Add search across title, URL, channel, tags, notes, and extracted metadata.
- Add import/export for video links.
- Add bulk actions in the admin video table.
- Add notes and timestamp comments after list/detail organization is stable.
