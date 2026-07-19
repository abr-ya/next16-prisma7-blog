# Video Feature Backlog

Use this backlog for video ideas that are not part of the current public pages milestone.

## Priority Candidates

### Metadata Extraction

Detailed thumbnail analysis and implementation tracking:

- Accepted baseline: `openspec/specs/video-library/spec.md`.
- Archived planning history:
  - `docs/archive/video-thumbnail-feature-plan.md`
  - `docs/archive/video-thumbnail-feature-task-list.md`

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

### Public Video Browse Controls

- Accepted baseline: `openspec/specs/video-library/spec.md`.
- Archived planning history: `docs/archive/video-public-browse-feature-plan.md`.
- Add public sorting so visitors can choose between recently added videos and video-date ordering.
- Add server-side pagination before the public list grows too large.
- Keep browse state in URL query params so sorted and paginated views are shareable.
- Add channel, tag, search, and provider filters only when those data surfaces are ready.

### Admin Video Table Pagination

- Add pagination to the admin video table when the library grows beyond a comfortable single-page table.
- Prefer a shared `DataTable` enhancement first, with client-side pagination and page-size controls such as 10, 20, and 50 rows.
- Keep server-side admin pagination as a later option if admin filtering, search, or very large datasets make loading all videos too heavy.
- Preserve the current TanStack sorting behavior while paginating.
- Consider applying the shared table pagination pattern to other admin tables after the video table proves it useful.

### Tags

- Model video tags closer to categories, not as a plain `String[]`.
- Add a user-owned `VideoTag` model.
- Add a join model such as `TagsToVideos`.
- Support multiple tags per video.
- Add tag selection in `VideoForm`.
- Add tag badges and tag filtering to list/detail views.

## Later Backlog

- Add video embeds after provider detection exists.
- Add broader search across title, URL, channel, tags, notes, and extracted metadata after public browse controls exist.
- Add import/export for video links.
- Add bulk actions in the admin video table.
- Add shared admin table pagination, starting with the video table.
- Add notes and timestamp comments after list/detail organization is stable.
- Fix the public navbar hydration warning by auditing `NavigationMenuList` HTML structure, especially the direct `Navigation:` text inside the menu list.
