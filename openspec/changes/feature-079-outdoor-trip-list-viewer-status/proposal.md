## Why

People browsing the public Trips list cannot tell whether a trip is their own, one they have joined, or simply a public trip they can view. Showing that relationship on each card makes the list immediately actionable without exposing private membership data.

## What Changes

- Add a signed-in viewer relationship status to published trip cards on `/trips`.
- Mark trips owned by the current user as `My trip` and trips with the current user's accepted active membership as `Participant`.
- Mark all other published trips as `Public trip`, including for anonymous visitors, while exposing no identity or membership data.
- Keep creator status higher priority than participant status and preserve existing public visibility, trip detail navigation, and admin authorization rules.

## Capabilities

### New Capabilities

- `outdoor-trip-list-viewer-status`: Viewer-specific ownership and accepted-participation labels on published trip list cards.

### Modified Capabilities

- None.

## Impact

- Affects the public `/trips` listing route, `getPublicHikes` data projection, and its trip-card UI.
- Reads the existing `Hike.userId` owner and `HikeParticipant` accepted-active membership records; no schema or migration changes are required.
- Does not change trip invitations, participant permissions, admin surfaces, or public access to published trips.
