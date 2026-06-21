# Public Video Browse Feature Plan

## Context

The public `/videos` page currently lists all public videos and sorts them by `videoDate` descending. That is useful when visitors care about the original video date, but it can be confusing when a newly added public video has an older `videoDate`.

This feature should improve public browsing without changing the current channel rollout.

## Goal

Add public video browse controls so visitors can choose a useful ordering and move through the public video library without loading every video at once.

## Product Decisions

- Keep public pages limited to videos with `visibility: PUBLIC`.
- Keep `videoDate` as the date of the video itself.
- Treat `createdAt` as the date the video was added to this library.
- Default public sorting is `Video date` (`videoDate desc`) so the library keeps emphasizing when the original videos were published.
- Keep channel visibility separate:
  - public video cards can show their selected channel;
  - hidden channels should not appear in standalone public channel indexes unless we later decide otherwise.
- Use URL query params for public browse state so links are shareable.

## Candidate URL Shape

Examples:

- `/videos`
- `/videos?sort=createdAt-desc`
- `/videos?sort=videoDate-desc`
- `/videos?sort=title-asc`
- `/videos?page=2`
- `/videos?channelId=...`

## Sorting

Start with a small sort set:

- `Recently added`: `createdAt desc`
- `Video date`: `videoDate desc`
- `Title`: `title asc`

Possible later additions:

- oldest first variants;
- recently updated;
- channel name once channel browse surfaces exist.

## Pagination

Start with server-side pagination.

Options:

- page-based pagination with `page` and `pageSize`;
- "Load more" as a later enhancement if the UI benefits from it.

Initial default:

- `pageSize`: 12 or 24 videos;
- preserve active `sort` and filter params when changing pages.

## Filters

Start only when there is enough public data to make filters useful.

Likely filters:

- channel;
- tags, after video tags exist;
- search text across title and URL;
- provider, after provider detection exists.

Do not add a visibility filter to the public UI. The public query should always stay scoped to `PUBLIC` videos.

## Implementation Checklist

- [x] VPB-01 Decide default public sort (`createdAt desc` vs `videoDate desc`). Use `Video date` (`videoDate desc`) by default.
- [x] VPB-02 Add sort parsing for `/videos` search params.
- [x] VPB-03 Update `getPublicVideos` to accept sort options.
- [x] VPB-04 Add server-side pagination metadata for public videos.
- [x] VPB-05 Add compact sort controls to `/videos`.
- [x] VPB-06 Add pagination controls to `/videos`.
- [x] VPB-07 Preserve query params across sort and page changes.
- [ ] VPB-08 Add channel filter only after public channel browse behavior is clear.
- [x] VPB-09 Run `npm run tsc`.
- [x] VPB-10 Run `npm run lint`.
- [ ] VPB-11 Manually verify default sort, alternate sort, and pagination.

## Could Do Later

- Add a "Load more" interaction instead of page links.
- Add search across title, URL, channel, tags, notes, and metadata.
- Add provider filters after provider detection exists.
- Add public channel pages if grouping by channel becomes useful inside this site.
