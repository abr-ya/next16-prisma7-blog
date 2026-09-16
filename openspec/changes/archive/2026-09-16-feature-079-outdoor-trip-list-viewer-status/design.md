## Context

`/trips` delegates to the legacy public hikes listing and renders cards from `getPublicHikes`. The existing query returns every published record but has no viewer-specific membership projection. Trip ownership is already stored on `Hike.userId`; invitation-backed membership is stored in `HikeParticipant` and only accepted, active records confer participation.

## Goals / Non-Goals

**Goals:**

- Return a minimal, current-viewer-specific relationship value with each published trip.
- Render exactly one stable label per card for owner, accepted participant, or public viewer.
- Keep public listing content safe for anonymous visitors and avoid per-card database queries.

**Non-Goals:**

- No schema, migration, invitation workflow, participant-management, sorting, filtering, or authorization changes.
- No disclosure of the trip creator, participant list, invitation state, or administrator relationship.
- No changes to trip detail pages or admin surfaces.

## Decisions

1. The server-side list query will resolve the current session once, then project a viewer relation alongside each published trip. It will use the persisted owner id and a filtered current-user participant relation rather than invoking a membership helper once per card. This keeps the list to a bounded query shape and avoids N+1 reads.
2. The relation is a presentation-specific value with three outcomes: `creator`, `participant`, and `viewer`. Owner takes precedence; only an accepted, unexpired participant row selects `participant`; all other cases select `viewer`. The card maps those values to `My trip`, `Participant`, and `Public trip`.
3. Anonymous users receive only `viewer`, so the same card structure can show `Public trip` without attempting a participant lookup or exposing identity data.
4. Existing published filters remain the source of public visibility. The viewer status changes neither which records are returned nor what a user can open.

## Risks / Trade-offs

- [Stale expired invitation appears as participation] → Apply the same active/expiry interpretation as the existing participant authorization boundary when filtering the current user's row.
- [Private relationship data leaks through the list payload] → Select only the current user's qualifying membership record, reduce it to the three-state value on the server, and do not serialize other participant data.
- [Label competes with date/type badges on narrow cards] → Use an existing compact badge and verify the responsive card layout manually.

## Migration Plan

Deploy as an application-only change. Rollback consists of reverting the list projection and relationship badge; no stored data is changed.
