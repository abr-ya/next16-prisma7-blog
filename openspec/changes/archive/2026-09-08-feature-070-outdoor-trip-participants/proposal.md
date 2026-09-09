## Why

Trip owners need a safe way to build a participant group before public contribution features arrive. Entering a known email should create an invitation that the recipient explicitly accepts, rather than immediately granting permissions or requiring an admin to manage the group.

## What Changes

- Add trip-scoped participant invitations addressed to an existing site account by its email address, with pending, accepted, declined, cancelled, and expired states.
- Let a trip owner invite, cancel a pending invitation, and remove an accepted participant; administrators retain an override for those management actions.
- Give invited users an authenticated, trip-scoped accept/decline control, without exposing invitation information publicly.
- Keep trip participation management compact in the right side of the trip-page header, opening its invite and state controls in a dialog rather than occupying the main trip content.
- Treat only an accepted invitation as active trip membership and the future basis for participant contribution permissions.
- Preserve existing trip ownership, records, media associations, and public visibility rules.

### Non-goals

- Sending email, SMS, push notifications, or creating invitations for people without an existing account.
- Showing participant names or avatars on public trip pages; that is a separate follow-up.
- Public photo/track upload or other participant contribution UI.
- Changing the internal Hike/Prisma naming retained by feature-069.

## Capabilities

### New Capabilities

- `outdoor-trip-participants`: Invitation-backed, accepted trip membership and its owner/admin/recipient authorization boundaries.

### Modified Capabilities

- `outdoor-hike-media-map`: Replace direct creator add/remove participant behavior with invitation-backed acceptance and define accepted membership as the source of participant contribution permissions.

## Impact

- Affected routes: authenticated invitation inbox at `/trips/invitations` and owner/admin controls on `/trips/[slug]`; no new public routes or legacy-route changes.
- Affected data: additive invitation/membership relation between existing `Hike` (Trip) and `User` records, with a data-preserving Prisma migration.
- Affected server/UI areas: trip data helpers and actions, public trip detail server/client components, and authorization helpers. No external mail service or new dependency is required.
