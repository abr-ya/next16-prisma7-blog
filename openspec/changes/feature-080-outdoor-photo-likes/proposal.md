## Why

Visitors can browse published trip photos but cannot express lightweight appreciation or see which photos resonate with others. A small, auditable like interaction provides that signal without prematurely adding ratings, text discussion, or a standalone photo social surface.

## What Changes

- Add a signed-in one-like-per-user interaction for eligible published trip photos.
- Show a public total like count and a signed-in viewer's current like state on each eligible photo.
- Require server-authoritative visibility checks, duplicate prevention, and safe revalidation after liking or unliking.
- Keep photo comments, ratings, reactions beyond likes, notifications, activity feeds, and moderation tooling out of this slice.

## Capabilities

### New Capabilities

- `outdoor-photo-likes`: Lightweight likes on published trip-linked photos with public counts and viewer-specific state.

### Modified Capabilities

- None.

## Impact

- Adds a Prisma photo-like relation and forward migration, plus server data/actions and the public trip photo gallery UI.
- Affects public `/trips/[slug]` photo cards and authenticated interaction only; it does not add admin pages, new public routes, or new dependencies.
- Preserves photo publication, trip association, thumbnail/full-image, ownership, participant, and administrator access boundaries.
