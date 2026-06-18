# Video Channel Feature Plan

## Context

The video feature already supports admin CRUD, private/public visibility, public video pages, and an accepted thumbnail MVP. Channels are the next organization layer for saved videos.

Earlier planning treated channels as user-owned folders. The updated direction is different: channels are a shared directory of external video channels that any saved video can reference.

## Goal

Add global video channels with an external URL and optional image so videos can be grouped by their real source channel.

Examples:

- a YouTube channel;
- a Twitch channel;
- a Vimeo profile;
- any external channel-like page that has a stable URL.

## Product Decisions

- Channels are global, not user-owned.
- Videos remain user-owned through `Video.userId`.
- A channel has an external `url`; opening a channel sends the user to the external service.
- A channel can have an optional `imageUrl` for logo/avatar/cover display.
- Channels have visibility:
  - `PUBLIC`: available for public UI display.
  - `HIDDEN`: available in admin selection but hidden from public channel surfaces.
- New channels default to `PUBLIC`.
- A video can have no channel.
- Deleting a channel must not delete videos. Videos should keep working with `channelId = null`.

## Data Model

```prisma
enum VideoChannelVisibility {
  PUBLIC
  HIDDEN
}

model VideoChannel {
  id         String                 @id @default(uuid())
  name       String
  url        String
  imageUrl   String?
  visibility VideoChannelVisibility @default(PUBLIC)
  videos     Video[]
  createdAt  DateTime               @default(now())
  updatedAt  DateTime               @default(now()) @updatedAt

  @@index([visibility])
}
```

Add an optional relation to `Video`:

```prisma
model Video {
  channelId String?
  channel   VideoChannel? @relation(fields: [channelId], references: [id], onDelete: SetNull)
}
```

## Admin Behavior

- Add a channel admin page for listing channels.
- Add channel create/edit UI with:
  - name;
  - external URL;
  - optional image;
  - visibility.
- Validate `url` as a generic URL.
- Validate `imageUrl` as an optional supported image URL.
- Add a channel selector to `VideoForm`.
- Allow clearing the selected channel from a video.
- Display the selected channel in `VideosTable` as an external link.

## Public Behavior

- Public video list/detail views can show the video channel when the channel is `PUBLIC`.
- A public channel label should link to the channel's external `url`.
- Hidden channels should not be promoted in public UI.
- Videos with hidden channels should still remain public if the video itself is public.

## Deletion Behavior

Deleting a channel sets related videos to no channel through `onDelete: SetNull`.

The first implementation can use a confirmation prompt before deletion. A richer destructive-action dialog can be added later if the admin UI grows one.

## Implementation Checklist

- [x] VC-01 Add `VideoChannelVisibility` enum to `prisma/schema.prisma`.
- [x] VC-02 Add `VideoChannel` model with `name`, `url`, `imageUrl`, `visibility`, and timestamps.
- [x] VC-03 Add optional `channelId` and `channel` relation to `Video`.
- [x] VC-04 Use `onDelete: SetNull` for the `Video.channel` relation.
- [x] VC-05 Create Prisma migration for video channels.
- [x] VC-06 Regenerate Prisma Client.
- [x] VC-07 Add channel server actions.
- [x] VC-08 Add channel admin list page.
- [ ] VC-09 Add channel create/edit UI.
- [x] VC-10 Add channel selector to `VideoForm`.
- [x] VC-11 Persist `channelId` in `createVideo` and `updateVideo`.
- [ ] VC-12 Include channel data in admin video queries.
- [ ] VC-13 Show channel links in `VideosTable`.
- [ ] VC-14 Include public channel data in public video queries.
- [ ] VC-15 Show public channel links on public video list/detail views.
- [ ] VC-16 Run Prisma migration against the development database.
- [ ] VC-17 Run `npm run postinstall`.
- [x] VC-18 Run `npm run tsc`.
- [x] VC-19 Run `npm run lint`.
- [ ] VC-20 Run targeted ESLint for changed component files.
- [ ] VC-21 Manually verify channel create/edit/delete flows.
- [ ] VC-22 Manually verify video channel assignment and clearing.
- [ ] VC-23 Manually verify public videos with public, hidden, and missing channels.

## Could Do Later

- Add an internal public channel page if grouping by channel becomes useful inside this site.
- Add channel search and filters to public video pages.
- Add channel sorting controls.
- Track provider-specific metadata for channels.
- Store UploadThing file keys for channel images so old images can be cleaned up safely.
