## Context

Published photos appear only through published trip pages and a photo can remain an independent record even when associations change. The gallery already receives data from the server page and provides client-side controls, while authentication and public-trip visibility are enforced in server helpers. The existing `Comment` model is reserved for text comments and should not be overloaded for reactions.

## Goals / Non-Goals

**Goals:**

- Persist one idempotent like per user/photo pair and expose only the current-viewer state in the gallery.
- Keep public reads bounded for a trip gallery rather than querying likes per card.
- Authorize mutations from the server using the same published trip/photo association that rendered the control.
- Make a current-user-only liked-photo read available for a later private surface without exposing an account's likes publicly.

**Non-Goals:**

- Ratings, emoji reactions, comments, notification delivery, a liker list, feeds, ranking, and admin moderation UI.
- Changing the existing full-size photo access policy or allowing interaction with draft/unlinked content.

## Decisions

1. Add a dedicated `PhotoLike` relation with `photoId`, `userId`, timestamps, a composite unique key, and cascade deletion from both parent records. A separate relation is compact, supports database-level duplicate prevention, and avoids turning the text-comment model into a polymorphic reaction store.
2. Read likes with the published trip-gallery query only for an authenticated viewer's matching like ids, reducing them to `isLikedByViewer` before serializing. Anonymous gallery payloads contain no like data. Provide a separate server-only current-user query for a future "my likes" surface; it returns only likes whose photos are still publicly eligible through published trips and includes no other users' identities.
3. Toggle likes through a server action receiving both `hikeId` and `photoId`. Re-read the current session and verify the photo is published and currently linked to the specified published hike before creating or deleting the current user's row. The gallery is a client component, but it treats server refresh/revalidation as the source of truth.
4. Allow a signed-in user to like their own eligible photo; the feature measures appreciation rather than participation permissions. Render the control as a semi-transparent, top-right photo overlay so it does not compete with gallery metadata. Anonymous visitors see a clear sign-in-required overlay state, but cannot submit a mutation.

## Risks / Trade-offs

- [A stale page attempts to like an unlinked or unpublished photo] → Revalidate eligibility inside the server action, not only in the rendered UI.
- [Duplicate or racing requests inflate totals] → Enforce the composite unique key and make create/delete operations idempotent.
- [Like state exposes social relationships] → Return only the current viewer's boolean; provide no public count, liker list, or account identifiers.
- [A private liked-photo query leaks withdrawn content] → Filter it through the same current published-trip/photo eligibility boundary as public gallery reads.
- [Gallery query grows with photo count] → Fetch counts and viewer rows in bounded set-based reads for the already loaded photo ids.

## Migration Plan

Deploy a forward Prisma migration that adds the relation without altering existing photo records. Generate the Prisma client through the existing project flow. Roll back application behavior by removing the gallery control and reads; retain the relation/table until a separately reviewed data-removal migration is approved.
