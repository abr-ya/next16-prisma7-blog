## Context

Public video pages currently expose read-only details for videos with `PUBLIC` visibility. Authentication is already available on public video routes through the shared layout, and server-side helpers already separate public video reads from owner-scoped admin video writes.

Timestamp bookmarks add a user-owned layer on top of public videos. They need a new persisted model, authenticated mutations, public-video visibility checks, and a small client surface on `/videos/{id}` without making the video itself editable by visitors.

## Goals / Non-Goals

**Goals:**

- Persist timestamp bookmarks per authenticated user and public video.
- Let signed-in users create, edit, and delete only their own bookmarks from the public video detail page.
- Keep anonymous visitors on the existing read-only public video detail experience.
- Keep private videos inaccessible through bookmark reads and mutations.

**Non-Goals:**

- Shared or public bookmark lists.
- Comments or discussion.
- Full-text search over bookmarks.
- Import/export of bookmarks.
- Provider-player API integration for reading the current playback time automatically.

## Decisions

1. Add a `VideoBookmark` Prisma model with `id`, `videoId`, `userId`, `timestampSeconds`, optional `label`, optional `note`, and timestamps.

   Rationale: bookmarks are independent user data tied to a video. A separate model keeps them queryable, deletable with the video, and easy to index by user/video. Alternative considered: embedding bookmarks in a JSON column on `Video`; rejected because bookmarks belong to different users and need owner-scoped mutations.

2. Store timestamps as whole seconds and validate them as non-negative integers.

   Rationale: seconds are provider-neutral, URL-friendly, and simple to format as `HH:MM:SS`. Alternative considered: storing timestamp strings; rejected because ordering, validation, and future search are cleaner with numeric values.

3. Use server-side data helpers and server actions for bookmark reads and mutations.

   Rationale: this matches the existing `app/_data` pattern and keeps auth, ownership, and visibility checks on the server. The public detail page can fetch the current session and pass initial bookmark data to a client component for form state and inline actions.

4. Require the target video to be public for bookmark reads and writes.

   Rationale: public bookmarks are attached to the public detail workflow. If a video becomes private, non-owner visitors must not retain a public path to it. Existing video deletion should cascade bookmark deletion through the relation.

5. Revalidate `/videos/{id}` after bookmark mutations.

   Rationale: the detail page includes bookmark state for the signed-in user. Revalidating the specific detail route keeps the server-rendered state coherent after creates, updates, and deletes.

## Risks / Trade-offs

- Bookmark UI on an embedded provider cannot know the current playback time automatically → users enter or edit the timestamp manually for this slice.
- Public page caching may include user-specific bookmark data → keep bookmark reads tied to the current session and use server actions/revalidation deliberately.
- A video can become private after bookmarks exist → bookmark helpers must filter by `Video.visibility = PUBLIC`; existing bookmarks remain stored but are inaccessible from public routes while the video is private.
- Schema changes require migration and Prisma client regeneration → include explicit validation and generated-client steps, without manual edits to `generated/prisma`.

## Migration Plan

1. Add the `VideoBookmark` model and relations to `User` and `Video`.
2. Generate a migration with Prisma using the existing project flow.
3. Regenerate the Prisma client.
4. Implement bookmark helpers/actions and UI.
5. Validate with typecheck, lint, build, and a manual browser pass on `/videos/{id}` for signed-in and anonymous states.

Rollback is to remove the public bookmark UI/actions first, then drop the bookmark table in a follow-up migration if the feature is abandoned before data matters.

## Open Questions

- Should the bookmark form call the short text field `label`, `title`, or `note` in the UI? The implementation should pick the clearest copy based on existing component conventions.
