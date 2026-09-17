## Why

Visitors can browse published trip photos but cannot express lightweight appreciation. A small, auditable like interaction provides that signal without prematurely adding ratings, public popularity metrics, text discussion, or a standalone photo social surface.

## What Changes

- Add a signed-in one-like-per-user interaction for eligible published trip photos.
- Show a signed-in viewer's current like state through a subtle overlay control on each eligible photo, without a public total-like count.
- Provide a server-side read of the current user's liked photos for a future private "my likes" surface, without adding that UI or route in this slice.
- Require server-authoritative visibility checks, duplicate prevention, and safe revalidation after liking or unliking.
- Keep photo comments, ratings, reactions beyond likes, notifications, activity feeds, and moderation tooling out of this slice.

## Capabilities

### New Capabilities

- `outdoor-photo-likes`: Lightweight likes on published trip-linked photos with viewer-specific state and no public count.

### Modified Capabilities

- None.

## Impact

- Adds a Prisma photo-like relation and forward migration, plus server data/actions and the public trip photo gallery UI.
- Affects public `/trips/[slug]` photo cards plus a private server-side current-user read; it does not add admin pages, new public routes, or new dependencies.
- Preserves photo publication, trip association, thumbnail/full-image, ownership, participant, and administrator access boundaries.
